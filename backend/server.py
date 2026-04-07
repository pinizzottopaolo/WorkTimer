from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import bcrypt
import jwt
import secrets
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from pathlib import Path

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_ALGORITHM = "HS256"

def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(hours=24), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=30), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Pydantic Models ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str

class ClienteCreate(BaseModel):
    nome: str
    email: Optional[str] = None
    telefono: Optional[str] = None
    indirizzo: Optional[str] = None

class ClienteOut(BaseModel):
    id: str
    nome: str
    email: Optional[str] = None
    telefono: Optional[str] = None
    indirizzo: Optional[str] = None

class OperazioneTemplateCreate(BaseModel):
    nome: str
    descrizione: Optional[str] = None

class OperazioneTemplateOut(BaseModel):
    id: str
    nome: str
    descrizione: Optional[str] = None

class OperazioneInput(BaseModel):
    nome: str
    n_fogli: Optional[int] = 0
    n_parti: Optional[int] = 0
    n_colli: Optional[int] = 0
    tempo_stimato: int = 0  # minuti
    tempo_effettivo: int = 0  # minuti
    timer_start: Optional[str] = None
    completata: bool = False

class SchedaLavoroCreate(BaseModel):
    cliente_id: str
    lavoro: str
    n_ordine_cliente: Optional[str] = None
    n_ordine_interno: Optional[str] = None
    data_lavoro: str
    operazioni: List[OperazioneInput] = []
    note: Optional[str] = None
    problemi: Optional[str] = None

class SchedaLavoroUpdate(BaseModel):
    cliente_id: Optional[str] = None
    lavoro: Optional[str] = None
    n_ordine_cliente: Optional[str] = None
    n_ordine_interno: Optional[str] = None
    data_lavoro: Optional[str] = None
    operazioni: Optional[List[OperazioneInput]] = None
    note: Optional[str] = None
    problemi: Optional[str] = None
    stato: Optional[str] = None

class SchedaLavoroOut(BaseModel):
    id: str
    cliente_id: str
    cliente_nome: Optional[str] = None
    operatore_id: str
    operatore_nome: Optional[str] = None
    lavoro: str
    n_ordine_cliente: Optional[str] = None
    n_ordine_interno: Optional[str] = None
    data_lavoro: str
    operazioni: List[dict]
    note: Optional[str] = None
    problemi: Optional[str] = None
    stato: str
    tempo_totale_stimato: int
    tempo_totale_effettivo: int
    created_at: str
    updated_at: str

# --- Auth Helper ---
async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "role": user["role"]
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(request: Request) -> dict:
    user = await get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# --- Brute Force Protection ---
async def check_brute_force(identifier: str):
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("count", 0) >= 5:
        lockout_until = attempt.get("lockout_until")
        if lockout_until and datetime.now(timezone.utc) < lockout_until:
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again later.")
        else:
            await db.login_attempts.delete_one({"identifier": identifier})

async def record_failed_attempt(identifier: str):
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt:
        new_count = attempt.get("count", 0) + 1
        update = {"$set": {"count": new_count}}
        if new_count >= 5:
            update["$set"]["lockout_until"] = datetime.now(timezone.utc) + timedelta(minutes=15)
        await db.login_attempts.update_one({"identifier": identifier}, update)
    else:
        await db.login_attempts.insert_one({"identifier": identifier, "count": 1})

async def clear_failed_attempts(identifier: str):
    await db.login_attempts.delete_one({"identifier": identifier})

# --- Auth Routes ---
@api_router.post("/auth/register")
async def register(data: UserRegister, response: Response):
    email = data.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed = hash_password(data.password)
    user_doc = {
        "email": email,
        "password_hash": hashed,
        "name": data.name,
        "role": "operatore",
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="none", max_age=2592000, path="/")
    
    return {"id": user_id, "email": email, "name": data.name, "role": "operatore"}

@api_router.post("/auth/login")
async def login(data: UserLogin, request: Request, response: Response):
    email = data.email.lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    
    await check_brute_force(identifier)
    
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user["password_hash"]):
        await record_failed_attempt(identifier)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    await clear_failed_attempts(identifier)
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="none", max_age=2592000, path="/")
    
    return {"id": user_id, "email": user["email"], "name": user["name"], "role": user["role"]}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        user_id = str(user["_id"])
        access_token = create_access_token(user_id, user["email"])
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=86400, path="/")
        return {"message": "Token refreshed"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# --- Users Management (Admin) ---
@api_router.get("/users", response_model=List[UserOut])
async def get_users(request: Request):
    await require_admin(request)
    users = await db.users.find({}, {"password_hash": 0}).to_list(1000)
    return [{"id": str(u["_id"]), "email": u["email"], "name": u["name"], "role": u["role"]} for u in users]

@api_router.put("/users/{user_id}/role")
async def update_user_role(user_id: str, role: str, request: Request):
    await require_admin(request)
    if role not in ["admin", "operatore"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"role": role}})
    return {"message": "Role updated"}

# --- Clienti Routes ---
@api_router.post("/clienti", response_model=ClienteOut)
async def create_cliente(data: ClienteCreate, request: Request):
    await get_current_user(request)
    doc = data.model_dump()
    doc["created_at"] = datetime.now(timezone.utc)
    result = await db.clienti.insert_one(doc)
    return {"id": str(result.inserted_id), **data.model_dump()}

@api_router.get("/clienti", response_model=List[ClienteOut])
async def get_clienti(request: Request):
    await get_current_user(request)
    clienti = await db.clienti.find({}).to_list(1000)
    return [{"id": str(c["_id"]), "nome": c["nome"], "email": c.get("email"), "telefono": c.get("telefono"), "indirizzo": c.get("indirizzo")} for c in clienti]

@api_router.put("/clienti/{cliente_id}", response_model=ClienteOut)
async def update_cliente(cliente_id: str, data: ClienteCreate, request: Request):
    await get_current_user(request)
    await db.clienti.update_one({"_id": ObjectId(cliente_id)}, {"$set": data.model_dump()})
    return {"id": cliente_id, **data.model_dump()}

@api_router.delete("/clienti/{cliente_id}")
async def delete_cliente(cliente_id: str, request: Request):
    await get_current_user(request)
    await db.clienti.delete_one({"_id": ObjectId(cliente_id)})
    return {"message": "Cliente deleted"}

# --- Operazioni Template Routes ---
@api_router.post("/operazioni-template", response_model=OperazioneTemplateOut)
async def create_operazione_template(data: OperazioneTemplateCreate, request: Request):
    await get_current_user(request)
    doc = data.model_dump()
    doc["created_at"] = datetime.now(timezone.utc)
    result = await db.operazioni_template.insert_one(doc)
    return {"id": str(result.inserted_id), **data.model_dump()}

@api_router.get("/operazioni-template", response_model=List[OperazioneTemplateOut])
async def get_operazioni_template(request: Request):
    await get_current_user(request)
    ops = await db.operazioni_template.find({}).to_list(1000)
    return [{"id": str(o["_id"]), "nome": o["nome"], "descrizione": o.get("descrizione")} for o in ops]

@api_router.delete("/operazioni-template/{op_id}")
async def delete_operazione_template(op_id: str, request: Request):
    await get_current_user(request)
    await db.operazioni_template.delete_one({"_id": ObjectId(op_id)})
    return {"message": "Operazione template deleted"}

# --- Schede Lavoro Routes ---
@api_router.post("/schede", response_model=SchedaLavoroOut)
async def create_scheda(data: SchedaLavoroCreate, request: Request):
    user = await get_current_user(request)
    
    cliente = await db.clienti.find_one({"_id": ObjectId(data.cliente_id)})
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente not found")
    
    now = datetime.now(timezone.utc)
    operazioni = [op.model_dump() for op in data.operazioni]
    tempo_stimato = sum(op.get("tempo_stimato", 0) for op in operazioni)
    tempo_effettivo = sum(op.get("tempo_effettivo", 0) for op in operazioni)
    
    doc = {
        "cliente_id": data.cliente_id,
        "cliente_nome": cliente["nome"],
        "operatore_id": user["id"],
        "operatore_nome": user["name"],
        "lavoro": data.lavoro,
        "n_ordine_cliente": data.n_ordine_cliente,
        "n_ordine_interno": data.n_ordine_interno,
        "data_lavoro": data.data_lavoro,
        "operazioni": operazioni,
        "note": data.note,
        "problemi": data.problemi,
        "stato": "in_corso",
        "tempo_totale_stimato": tempo_stimato,
        "tempo_totale_effettivo": tempo_effettivo,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    result = await db.schede_lavoro.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    return doc

@api_router.get("/schede", response_model=List[SchedaLavoroOut])
async def get_schede(request: Request, stato: Optional[str] = None, cliente_id: Optional[str] = None, operatore_id: Optional[str] = None, data_da: Optional[str] = None, data_a: Optional[str] = None):
    user = await get_current_user(request)
    
    query = {}
    if stato:
        query["stato"] = stato
    if cliente_id:
        query["cliente_id"] = cliente_id
    if operatore_id:
        query["operatore_id"] = operatore_id
    if data_da:
        query["data_lavoro"] = {"$gte": data_da}
    if data_a:
        if "data_lavoro" in query:
            query["data_lavoro"]["$lte"] = data_a
        else:
            query["data_lavoro"] = {"$lte": data_a}
    
    # Non-admin users see only their schede
    if user["role"] != "admin":
        query["operatore_id"] = user["id"]
    
    schede = await db.schede_lavoro.find(query).sort("created_at", -1).to_list(1000)
    return [{"id": str(s["_id"]), **{k: v for k, v in s.items() if k != "_id"}} for s in schede]

@api_router.get("/schede/{scheda_id}", response_model=SchedaLavoroOut)
async def get_scheda(scheda_id: str, request: Request):
    user = await get_current_user(request)
    scheda = await db.schede_lavoro.find_one({"_id": ObjectId(scheda_id)})
    if not scheda:
        raise HTTPException(status_code=404, detail="Scheda not found")
    if user["role"] != "admin" and scheda["operatore_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return {"id": str(scheda["_id"]), **{k: v for k, v in scheda.items() if k != "_id"}}

@api_router.put("/schede/{scheda_id}", response_model=SchedaLavoroOut)
async def update_scheda(scheda_id: str, data: SchedaLavoroUpdate, request: Request):
    user = await get_current_user(request)
    scheda = await db.schede_lavoro.find_one({"_id": ObjectId(scheda_id)})
    if not scheda:
        raise HTTPException(status_code=404, detail="Scheda not found")
    if user["role"] != "admin" and scheda["operatore_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    if "cliente_id" in update_data:
        cliente = await db.clienti.find_one({"_id": ObjectId(update_data["cliente_id"])})
        if cliente:
            update_data["cliente_nome"] = cliente["nome"]
    
    if "operazioni" in update_data:
        operazioni = update_data["operazioni"]
        update_data["tempo_totale_stimato"] = sum(op.get("tempo_stimato", 0) for op in operazioni)
        update_data["tempo_totale_effettivo"] = sum(op.get("tempo_effettivo", 0) for op in operazioni)
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.schede_lavoro.update_one({"_id": ObjectId(scheda_id)}, {"$set": update_data})
    
    updated = await db.schede_lavoro.find_one({"_id": ObjectId(scheda_id)})
    return {"id": str(updated["_id"]), **{k: v for k, v in updated.items() if k != "_id"}}

@api_router.delete("/schede/{scheda_id}")
async def delete_scheda(scheda_id: str, request: Request):
    user = await get_current_user(request)
    scheda = await db.schede_lavoro.find_one({"_id": ObjectId(scheda_id)})
    if not scheda:
        raise HTTPException(status_code=404, detail="Scheda not found")
    if user["role"] != "admin" and scheda["operatore_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    await db.schede_lavoro.delete_one({"_id": ObjectId(scheda_id)})
    return {"message": "Scheda deleted"}

# --- Statistics Routes ---
@api_router.get("/stats/overview")
async def get_stats_overview(request: Request):
    user = await get_current_user(request)
    query = {} if user["role"] == "admin" else {"operatore_id": user["id"]}
    
    total_schede = await db.schede_lavoro.count_documents(query)
    schede_in_corso = await db.schede_lavoro.count_documents({**query, "stato": "in_corso"})
    schede_completate = await db.schede_lavoro.count_documents({**query, "stato": "completata"})
    
    pipeline = [
        {"$match": query},
        {"$group": {
            "_id": None,
            "tempo_stimato_totale": {"$sum": "$tempo_totale_stimato"},
            "tempo_effettivo_totale": {"$sum": "$tempo_totale_effettivo"}
        }}
    ]
    result = await db.schede_lavoro.aggregate(pipeline).to_list(1)
    tempi = result[0] if result else {"tempo_stimato_totale": 0, "tempo_effettivo_totale": 0}
    
    return {
        "total_schede": total_schede,
        "schede_in_corso": schede_in_corso,
        "schede_completate": schede_completate,
        "tempo_stimato_totale": tempi.get("tempo_stimato_totale", 0),
        "tempo_effettivo_totale": tempi.get("tempo_effettivo_totale", 0)
    }

@api_router.get("/stats/per-cliente")
async def get_stats_per_cliente(request: Request):
    user = await get_current_user(request)
    query = {} if user["role"] == "admin" else {"operatore_id": user["id"]}
    
    pipeline = [
        {"$match": query},
        {"$group": {
            "_id": "$cliente_nome",
            "schede_count": {"$sum": 1},
            "tempo_stimato": {"$sum": "$tempo_totale_stimato"},
            "tempo_effettivo": {"$sum": "$tempo_totale_effettivo"}
        }},
        {"$sort": {"schede_count": -1}}
    ]
    result = await db.schede_lavoro.aggregate(pipeline).to_list(100)
    return [{"cliente": r["_id"], "schede_count": r["schede_count"], "tempo_stimato": r["tempo_stimato"], "tempo_effettivo": r["tempo_effettivo"]} for r in result]

@api_router.get("/stats/per-operatore")
async def get_stats_per_operatore(request: Request):
    await require_admin(request)
    
    pipeline = [
        {"$group": {
            "_id": "$operatore_nome",
            "schede_count": {"$sum": 1},
            "tempo_stimato": {"$sum": "$tempo_totale_stimato"},
            "tempo_effettivo": {"$sum": "$tempo_totale_effettivo"}
        }},
        {"$sort": {"schede_count": -1}}
    ]
    result = await db.schede_lavoro.aggregate(pipeline).to_list(100)
    return [{"operatore": r["_id"], "schede_count": r["schede_count"], "tempo_stimato": r["tempo_stimato"], "tempo_effettivo": r["tempo_effettivo"]} for r in result]

@api_router.get("/stats/per-periodo")
async def get_stats_per_periodo(request: Request, data_da: Optional[str] = None, data_a: Optional[str] = None):
    user = await get_current_user(request)
    query = {} if user["role"] == "admin" else {"operatore_id": user["id"]}
    
    if data_da:
        query["data_lavoro"] = {"$gte": data_da}
    if data_a:
        if "data_lavoro" in query:
            query["data_lavoro"]["$lte"] = data_a
        else:
            query["data_lavoro"] = {"$lte": data_a}
    
    pipeline = [
        {"$match": query},
        {"$group": {
            "_id": "$data_lavoro",
            "schede_count": {"$sum": 1},
            "tempo_stimato": {"$sum": "$tempo_totale_stimato"},
            "tempo_effettivo": {"$sum": "$tempo_totale_effettivo"}
        }},
        {"$sort": {"_id": 1}}
    ]
    result = await db.schede_lavoro.aggregate(pipeline).to_list(365)
    return [{"data": r["_id"], "schede_count": r["schede_count"], "tempo_stimato": r["tempo_stimato"], "tempo_effettivo": r["tempo_effettivo"]} for r in result]

@api_router.get("/stats/per-operazione")
async def get_stats_per_operazione(request: Request):
    user = await get_current_user(request)
    query = {} if user["role"] == "admin" else {"operatore_id": user["id"]}
    
    pipeline = [
        {"$match": query},
        {"$unwind": "$operazioni"},
        {"$group": {
            "_id": "$operazioni.nome",
            "count": {"$sum": 1},
            "tempo_stimato": {"$sum": "$operazioni.tempo_stimato"},
            "tempo_effettivo": {"$sum": "$operazioni.tempo_effettivo"}
        }},
        {"$sort": {"count": -1}}
    ]
    result = await db.schede_lavoro.aggregate(pipeline).to_list(100)
    return [{"operazione": r["_id"], "count": r["count"], "tempo_stimato": r["tempo_stimato"], "tempo_effettivo": r["tempo_effettivo"]} for r in result]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[os.environ.get('FRONTEND_URL', 'http://localhost:3000')],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Startup Events ---
@app.on_event("startup")
async def startup():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.clienti.create_index("nome")
    await db.schede_lavoro.create_index("operatore_id")
    await db.schede_lavoro.create_index("cliente_id")
    await db.schede_lavoro.create_index("data_lavoro")
    
    # Seed admin user
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({"email": admin_email, "password_hash": hashed, "name": "Admin", "role": "admin", "created_at": datetime.now(timezone.utc)})
        logger.info(f"Admin user created: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info(f"Admin password updated: {admin_email}")
    
    # Seed default operazioni template
    default_ops = ["Taglio", "Rilegatura", "Incollaggio", "Fustellatura", "Plastificazione", "Impacchettamento", "Perforazione", "Copertina", "Assemblaggio"]
    for op in default_ops:
        existing_op = await db.operazioni_template.find_one({"nome": op})
        if not existing_op:
            await db.operazioni_template.insert_one({"nome": op, "descrizione": None, "created_at": datetime.now(timezone.utc)})
    
    # Write test credentials
    Path("/app/memory").mkdir(parents=True, exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write(f"# Test Credentials\n\n")
        f.write(f"## Admin\n- Email: {admin_email}\n- Password: {admin_password}\n- Role: admin\n\n")
        f.write(f"## Auth Endpoints\n- POST /api/auth/register\n- POST /api/auth/login\n- POST /api/auth/logout\n- GET /api/auth/me\n- POST /api/auth/refresh\n")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
