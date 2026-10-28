import os
import sys
sys.path.insert(0, ".")
os.environ["JWT_SECRET_KEY"] = "test-jwt-secret-key-32-chars-minimum-length!"
os.environ["NEO4J_PASSWORD"] = "test-neo4j-secure-password-123!"
os.environ["ENVIRONMENT"] = "test"

import asyncio
from backend.app.knowledge.domain.retrieval import RetrievalRequest
from backend.app.knowledge.retrieval.hybrid import hybrid_retrieval_service
from data.seed.seed_data import seed_knowledge_base
from backend.app.common.init_db import init_models

async def main():
    await init_models()
    await seed_knowledge_base()
    
    # 1. Test out-of-domain query
    req1 = RetrievalRequest(
        query="What is the tax rate on quantum teleporters in Antarctica under Martian colonial law?",
        top_k=3
    )
    pack1 = await hybrid_retrieval_service.retrieve(req1)
    print("TEST 1 (Martian): Items =", len(pack1.items), "State =", pack1.fail_safe_state, "Conf =", pack1.evidence_confidence)

    # 2. Test legitimate RTI query
    req2 = RetrievalRequest(
        query="What is the timeline and procedure to dispose of an RTI application under Section 7?",
        top_k=3
    )
    pack2 = await hybrid_retrieval_service.retrieve(req2)
    print("TEST 2 (RTI Section 7): Items =", len(pack2.items), "State =", pack2.fail_safe_state, "Conf =", pack2.evidence_confidence)

asyncio.run(main())
