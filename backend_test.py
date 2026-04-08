import requests
import sys
import json
from datetime import datetime, timedelta

class WorkTimerAPITester:
    def __init__(self, base_url="https://stampa-confezione.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.cookies = {}
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_user = None
        self.test_cliente_id = None
        self.test_scheda_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, cookies=self.cookies)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, cookies=self.cookies)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, cookies=self.cookies)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, cookies=self.cookies)

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed")
                
                # Store cookies for session management
                if response.cookies:
                    self.cookies.update(response.cookies)
                
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login and get token"""
        print("\n=== TESTING ADMIN LOGIN ===")
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@worktimer.com", "password": "Admin123!"}
        )
        if success:
            self.admin_user = response
            print(f"   Admin user: {response}")
            return True
        return False

    def test_auth_me(self):
        """Test getting current user info"""
        print("\n=== TESTING AUTH ME ===")
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_stats_overview(self):
        """Test stats overview endpoint"""
        print("\n=== TESTING STATS OVERVIEW ===")
        success, response = self.run_test(
            "Stats Overview",
            "GET",
            "stats/overview",
            200
        )
        if success:
            print(f"   Stats: {response}")
        return success

    def test_create_cliente(self):
        """Test creating a new cliente"""
        print("\n=== TESTING CREATE CLIENTE ===")
        cliente_data = {
            "nome": "Test Cliente",
            "email": "test@cliente.com",
            "telefono": "123456789",
            "indirizzo": "Via Test 123"
        }
        success, response = self.run_test(
            "Create Cliente",
            "POST",
            "clienti",
            200,
            data=cliente_data
        )
        if success:
            self.test_cliente_id = response.get('id')
            print(f"   Created cliente ID: {self.test_cliente_id}")
        return success

    def test_get_clienti(self):
        """Test getting all clienti"""
        print("\n=== TESTING GET CLIENTI ===")
        success, response = self.run_test(
            "Get Clienti",
            "GET",
            "clienti",
            200
        )
        if success:
            print(f"   Found {len(response)} clienti")
        return success

    def test_get_operazioni_template(self):
        """Test getting operazioni template"""
        print("\n=== TESTING GET OPERAZIONI TEMPLATE ===")
        success, response = self.run_test(
            "Get Operazioni Template",
            "GET",
            "operazioni-template",
            200
        )
        if success:
            print(f"   Found {len(response)} operazioni template")
            for op in response[:3]:  # Show first 3
                print(f"     - {op.get('nome')}")
        return success

    def test_create_scheda(self):
        """Test creating a new scheda lavoro"""
        print("\n=== TESTING CREATE SCHEDA LAVORO ===")
        if not self.test_cliente_id:
            print("❌ Cannot test scheda creation - no cliente ID")
            return False
            
        scheda_data = {
            "cliente_id": self.test_cliente_id,
            "lavoro": "Test Catalogo",
            "n_ordine_cliente": "ORD-TEST-001",
            "n_ordine_interno": "INT-001",
            "data_lavoro": datetime.now().strftime('%Y-%m-%d'),
            "operazioni": [
                {
                    "nome": "Taglio",
                    "n_fogli": 100,
                    "n_parti": 4,
                    "n_colli": 1,
                    "tempo_stimato": 30,
                    "tempo_effettivo": 0,
                    "timer_start": None,
                    "completata": False
                },
                {
                    "nome": "Rilegatura",
                    "n_fogli": 100,
                    "n_parti": 1,
                    "n_colli": 1,
                    "tempo_stimato": 45,
                    "tempo_effettivo": 0,
                    "timer_start": None,
                    "completata": False
                }
            ],
            "note": "Test scheda lavoro",
            "problemi": ""
        }
        success, response = self.run_test(
            "Create Scheda Lavoro",
            "POST",
            "schede",
            200,
            data=scheda_data
        )
        if success:
            self.test_scheda_id = response.get('id')
            print(f"   Created scheda ID: {self.test_scheda_id}")
        return success

    def test_get_schede(self):
        """Test getting all schede"""
        print("\n=== TESTING GET SCHEDE ===")
        success, response = self.run_test(
            "Get Schede",
            "GET",
            "schede",
            200
        )
        if success:
            print(f"   Found {len(response)} schede")
        return success

    def test_get_scheda_detail(self):
        """Test getting scheda detail"""
        print("\n=== TESTING GET SCHEDA DETAIL ===")
        if not self.test_scheda_id:
            print("❌ Cannot test scheda detail - no scheda ID")
            return False
            
        success, response = self.run_test(
            "Get Scheda Detail",
            "GET",
            f"schede/{self.test_scheda_id}",
            200
        )
        if success:
            print(f"   Scheda: {response.get('lavoro')} - {response.get('stato')}")
            print(f"   Operazioni: {len(response.get('operazioni', []))}")
        return success

    def test_update_scheda(self):
        """Test updating scheda"""
        print("\n=== TESTING UPDATE SCHEDA ===")
        if not self.test_scheda_id:
            print("❌ Cannot test scheda update - no scheda ID")
            return False
            
        update_data = {
            "stato": "completata",
            "note": "Test scheda completata"
        }
        success, response = self.run_test(
            "Update Scheda",
            "PUT",
            f"schede/{self.test_scheda_id}",
            200,
            data=update_data
        )
        if success:
            print(f"   Updated stato to: {response.get('stato')}")
        return success

    def test_stats_per_cliente(self):
        """Test stats per cliente"""
        print("\n=== TESTING STATS PER CLIENTE ===")
        success, response = self.run_test(
            "Stats Per Cliente",
            "GET",
            "stats/per-cliente",
            200
        )
        if success:
            print(f"   Found stats for {len(response)} clienti")
        return success

    def test_stats_per_operatore(self):
        """Test stats per operatore (admin only)"""
        print("\n=== TESTING STATS PER OPERATORE ===")
        success, response = self.run_test(
            "Stats Per Operatore",
            "GET",
            "stats/per-operatore",
            200
        )
        if success:
            print(f"   Found stats for {len(response)} operatori")
        return success

    def test_stats_per_operazione(self):
        """Test stats per operazione"""
        print("\n=== TESTING STATS PER OPERAZIONE ===")
        success, response = self.run_test(
            "Stats Per Operazione",
            "GET",
            "stats/per-operazione",
            200
        )
        if success:
            print(f"   Found stats for {len(response)} operazioni")
        return success

    def test_logout(self):
        """Test logout"""
        print("\n=== TESTING LOGOUT ===")
        success, response = self.run_test(
            "Logout",
            "POST",
            "auth/logout",
            200
        )
        if success:
            self.token = None
            self.cookies = {}
        return success

def main():
    print("🚀 Starting WorkTimer API Tests")
    print("=" * 50)
    
    tester = WorkTimerAPITester()
    
    # Test sequence
    tests = [
        tester.test_admin_login,
        tester.test_auth_me,
        tester.test_stats_overview,
        tester.test_get_operazioni_template,
        tester.test_create_cliente,
        tester.test_get_clienti,
        tester.test_create_scheda,
        tester.test_get_schede,
        tester.test_get_scheda_detail,
        tester.test_update_scheda,
        tester.test_stats_per_cliente,
        tester.test_stats_per_operatore,
        tester.test_stats_per_operazione,
        tester.test_logout
    ]
    
    # Run all tests
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())