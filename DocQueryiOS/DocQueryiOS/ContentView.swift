import SwiftUI
import Combine

// --- 1. DATA MODELS (How Swift reads your Django JSON) ---
struct Document: Identifiable, Codable {
    let id: Int
    let title: String
    let content: String
}

struct AuthResponse: Codable {
    let token: String
}

// --- 2. API ENGINE (The bridge to your Mac) ---
@MainActor
class NetworkManager: ObservableObject {
    // ⚠️ CRITICAL: Replace with your Mac's IP!
    let baseURL = "http://10.153.78.65:8000/api"
    
    @Published var documents: [Document] = []
    @Published var isAuthenticated = false
    @Published var errorMessage = ""
    
    @AppStorage("authToken") var authToken: String = "" {
        didSet { isAuthenticated = !authToken.isEmpty }
    }
    
    init() { self.isAuthenticated = !authToken.isEmpty }
    
    func login(username: String, password: String) async {
        guard let url = URL(string: "\(baseURL)/login/") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = ["username": username, "password": password]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
                errorMessage = "Invalid credentials."
                return
            }
            let authResponse = try JSONDecoder().decode(AuthResponse.self, from: data)
            self.authToken = authResponse.token
            errorMessage = ""
        } catch { errorMessage = "Cannot connect to server." }
    }
    
    func fetchDocuments() async {
        guard let url = URL(string: "\(baseURL)/documents/") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Token \(authToken)", forHTTPHeaderField: "Authorization")
        
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 401 {
                logout()
                return
            }
            self.documents = try JSONDecoder().decode([Document].self, from: data)
        } catch { print("Failed to fetch documents") }
    }
    
    func logout() {
        authToken = ""
        documents = []
    }
}

// --- 3. USER INTERFACE (What you see on the screen) ---
struct ContentView: View {
    @StateObject var network = NetworkManager()
    @State private var username = ""
    @State private var password = ""
    
    var body: some View {
        Group {
            if network.isAuthenticated {
                NavigationView {
                    List(network.documents) { doc in
                        VStack(alignment: .leading, spacing: 5) {
                            Text(doc.title).font(.headline).foregroundColor(.blue)
                            Text(doc.content).font(.subheadline).foregroundColor(.secondary)
                        }
                        .padding(.vertical, 4)
                    }
                    .navigationTitle("Your Vault")
                    .toolbar { Button("Logout") { network.logout() } }
                    .task { await network.fetchDocuments() }
                }
            } else {
                VStack(spacing: 20) {
                    Text("DocQuery iOS").font(.largeTitle).fontWeight(.bold)
                    
                    if !network.errorMessage.isEmpty {
                        Text(network.errorMessage).foregroundColor(.red)
                    }
                    
                    TextField("Username", text: $username)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .autocapitalization(.none)
                    
                    SecureField("Password", text: $password)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                    
                    Button(action: {
                        Task { await network.login(username: username, password: password) }
                    }) {
                        Text("Access Vault")
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .cornerRadius(10)
                    }
                }
                .padding()
            }
        }
    }
}
