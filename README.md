
# **AIpfs: The Autonomous On-chain  Agent Network**

Welcome to AIpfs, a modular network for generating and managing autonomous AI agents **fully** built on decentralized stacks, including IPFS, Filecoin, Solana, Ethereum, ENS, SNS, Glitter, etc. 

🔍  On-Chain Real-Time Transparency

🛠️  Serverless & Unstoppable Architecture

🆔  Cross-Chain Agent DID

🌐  Permissionless Access

🧠  Interoperable Swarm Intelligence

---

## **Architecture Overview**

### **System-Level Diagram**

```
+------------------------------------------------------------------------------+
|                                   User                                       |
+------------------------------------------------------------------------------+
|                                  Client                                      |
|       🌐 Web      ✖ DApps      🎮 Games      📸 Social Media      📱 Apps   |
+------------------------------------------------------------------------------+
|                     Universal Communication Layer                            |
|    Enables interaction between components across layers and cross-chain DID  |
|                         support for interoperability                         |
+------------------------------------------------------------------------------+
|                                    DID                                       |
|              .eth        .sol        .sui           .bnb                     |
|              🦄           🔥           📦             🟦                    |
+------------------------------------------------------------------------------+
|                                   IPFS                                       |
|  Agent Metadata and Memory                  +-----------------------------+  |
|  Integrated with decentralized storage      |           Plugins           |  |
|  and retrieval for transparency             |   - Wallets                 |  |
|                                             |   - DeFi                    |  |
|                                             |   - Data                    |  |
|                                             |   - Game Engines            |  |
|                                             +-----------------------------+  |
+------------------------------------------------------------------------------+
|                                   Models                                     |
|       🌞 OpenAI       🌀 Llama       🧠 Claude       ♾️ Gemini              ｜ 
|                                                                              |  
+------------------------------------------------------------------------------+
```

---

## **Features**

### **Core Functionalities**

1. **AI Agent Generation**
    - Users can generate AI agents via the official page (e.g., `AIpfs.eth`).
    - Metadata such as avatar, persona, description, and ENS bindings are submitted through forms.
    - Each agent is hosted on IPFS with a verifiable hash.
2. **Communication Protocol**
    - Agents communicate via their unique DID (e.g., `.eth`, `.sol`, `.sui`).
    - Users can summon agents by referencing their DID, enabling cross-chain interoperability.
3. **Data Storage**
    - Persistent storage of logs, interactions, and metadata on IPFS.
    - Open data for AI training and retrieval, facilitating reproducibility and transparency.
4. **Governance**
    - DID domains can be managed by user-owned DAOs.
    - Token-based governance for DID and agent management.

### **Components**

### **1. User Interface (UI)**

- **Frontend**: Built with modern web frameworks (React/Next.js).
- **Interaction**: Provides forms for agent metadata and IPFS deployment.

### **2. DID Layer**

- **Bindings**: DID are tied to IPFS content hashes using user signatures.
- **Extensions**: Support for `.eth`, `.sol`, `.sui`.

### **3. Agent Metadata Layer**

- **IPFS Storage**: Agent metadata stored as JSON files.
- **Structure**:

```
{
  "name": "AgentName",
  "avatar": "ipfs://hash",
  "description": "AI agent description",
  "did": "agentname.eth",
  "persona": "{Base Prompt Data}",
  "etc": "additional metadata"
}
```

### **4. LLM API Layer**

- **OpenRouter Integration**: Proxy LLM calls to GPT, Claude, Llama etc.
- **Extendable**: Add or replace model backends dynamically.

### **5. Context Memory Layer**

- **Glitter Protocol**:
    - Persistent storage of conversations.
    - Queryable memory for agent context.
- **User Control**: Session logging options for privacy.

### **6. Data Layer**

- **Data Sources**:
    - Decentralized databases from Glitter Protocol.
- **Usage**:
    - Fine-tune RAG (retrieval-augmented generation).

### **7. Wallet Component**

- **Integration**:
    - Web3 wallets like MetaMask / Phantom.
    - Multi-chain asset support.
- **Features**:
    - Secure transaction signing.
    - Access control for agents.

### **8. Governance Layer**

- **DAO Integration**:
    - Token-based voting mechanisms for ENS management.
    - Community-driven DID governance.
- **Flexibility**:
    - User retains the option for personal ENS control.

---

## **Implementation Details**

### **Generating a New AI Agent**

1. User fills out the agent creation form at `AIpfs.eth`.
2. Form submission triggers the following sequence:

```
+-------------+            +------------+             +------------+
| User Input  | --(JSON)-> | IPFS Node  | --(CID)---> | ENS Update |
+-------------+            +------------+             +------------+
```

1. IPFS generates a CID for the metadata.
2. User signs a transaction to bind the CID to their ENS domain.

### **Agent Communication Protocol**

- Agents communicate by resolving DIDs to content hashes:

```
+------------+          +----------------+          +------------+
| Requester  | --(DID)->| ENS Resolver   | --(CID)->| IPFS Node  |
+------------+          +----------------+          +------------+
```

### Agent-to-Agent Interaction Workflow

```
+------------+            +----------------+                +------------+
| Agent A    | ---(DID)-->| Communication  | ----(DID)----> | Agent B    |
| (Initiator)|            | Layer          |                | (Responder)|
+------------+            +----------------+                +------------+
       |                          |                              |
       v                          v                              v
+-------------+           +-----------------+              +-------------+
| ENS Resolver| --(CID)-->| Target Agent    | --(Request)->| Agent Logic |
| & Gateway   |           | IPFS Metadata   |              | Execution   |
+-------------+           +-----------------+              +-------------+
       |                          |                              |
       v                          v                              v
+-------------+            +----------------+             +--------------+
| Interaction | <-(Sync)-> | Context Memory | <--(Log)--- | Glitter DB   |
| Logs        |            | Update         |             | (RAG)        |
+-------------+            +----------------+             +--------------+
```

### Multi-Agent Workflow via Communication Layer

```
									+-------------------+
									|       Human       |
									|    (Requester)    |
									+-------------------+
									          |
									          v
+------------------------------------------------------+
|                 Communication Layer                  |
|  - DID-based routing                                 |
|  - Workflow orchestration                            |
|  - Agent invocation                                  |
+------------------------------------------------------+
    |                       |                       |
    v                       v                       v
+------------------+   +------------------+   +------------------+
|    AI Agent 1    |   |    AI Agent 2    |   |    AI Agent N    |
| (e.g., Language) |   | (e.g., Vision)   |   | (e.g., Trading)  |
+------------------+   +------------------+   +------------------+
    |                       |                       |
+------------------+   +------------------+   +------------------+
|  Task Output 1   |   |  Task Output 2   |   |  Task Output N   |
+------------------+   +------------------+   +------------------+
          \                   |                     /
           \                  v                    /
	      +-----------------------------------------------+
	      |        Final Workflow Integration             |
	      |   (Combines agent outputs into results)       |
	      +-----------------------------------------------+
```

### Real-time Transparent **Memory and Context Handling**

- Glitter Protocol stores conversational data:

```
    +-------------------+
    |       User        |
    | Starts Interaction|
    +-------------------+
             |
             v
+----------------------------+
| Query AI Agent DID via ENS |
| (Resolve On-chain IPFS)    |
+----------------------------+
             |
             v
+----------------------------+
| Fetch IPFS Metadata via    |
| Contenthash (Validate Hash)|
+----------------------------+
             |
             v
+----------------------------+
| Load Personality & Context |
| - Metadata Includes:       |
|   - Persona Data           |
|   - Interaction Interface  |
+----------------------------+
             |
             v
+-----------------------------+
| Live Interaction with Agent |
| Real-time Memory Sync to    |
| IPFS via Glitter Protocol   |
| - Context Logged in IPFS    |
| - CID Returned & Verified   |
+-----------------------------+
```

- Users can query, view past interactions.

### **Governance Workflow**

1. Users delegate ENS control to a DAO.
2. DAO uses governance tokens to vote on DID updates.

```
+-----------------------------+
| Community Development       |
| (New IPFS Persona Created)  |
+-----------------------------+
               |
               v
+-----------------------------+
| Submit Proposal to DAO      |
| (New Persona Version)       |
+-----------------------------+
               |
               v
+-----------------------------+
| DAO Token Voting            |
| (Proposal Approved or Not)  |
+-----------------------------+
               |
         +-----+-----+
         |           |
         v           v
+-----------------+ +-----------------+
| Proposal Passed | | Proposal Failed |
+-----------------+ +-----------------+
         |                   |
         |                   v
         |      +-----------------------------+
         |      | No Update to DID Content    |
         |      +-----------------------------+
         v
+-----------------------------+
| Update ENS Contenthash      |
| (Points to New IPFS CID)    |
+-----------------------------+
               |
               v
+-----------------------------+
| Publish Changes             |
| (DID Resolves to Updated    |
|  Persona Version)           |
+-----------------------------+
               |
               v
+-----------------------------+
| On-chain Record Tracking    |
| - DAO Vote Results          |
| - ENS Contenthash Changes   |
+-----------------------------+
```

---

## **Advantages Over Comparable Frameworks**

| **Feature** | **AIpfs Network** |
| --- | --- |
| **Transparency** | Fully open IPFS storage |
| **Decentralization** | DAO-governed ENS and DID management |
| **Cross-Chain Support** | DID interoperability across chains |
| **RAG Integration** | Built-in decentralized database query |
| **Governance** | Flexible DAO or user DID control |

---

## **Future Development**

1. **Multi-Agent Collaboration**
    - Enable agents to autonomously interact and execute multi-agent workflows.
2. **Enhanced RAG Framework**
    - Expand data sources.
3. **Privacy Enhancements**
    - zk-SNARKs for private interaction logs.
4. **Improved Scalability**
    - Layer 2 caching for IPFS and Glitter Protocol interactions.

---

## **Contributing**

We welcome contributions! Please see our [CONTRIBUTING.md] for guidelines.

---

## **License**

This project is licensed under the MIT License. See the [LICENSE] file for details.