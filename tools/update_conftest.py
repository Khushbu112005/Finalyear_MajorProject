with open('backend/tests/conftest.py', 'r', encoding='utf-8') as f:
    text = f.read()

target = """    # Initialize SQL database tables and seed verified sources synchronously
    asyncio.run(init_models())
    asyncio.run(seed_knowledge_base())
    yield"""

replacement = """    # Initialize SQL database tables and seed verified sources synchronously
    asyncio.run(init_models())
    asyncio.run(seed_knowledge_base())

    from backend.app.common.database import AsyncSessionLocal
    from data.seed.seed_government_services import seed_government_services

    async def _seed_gov():
        async with AsyncSessionLocal() as session:
            await seed_government_services(session)

    asyncio.run(_seed_gov())
    yield"""

text = text.replace(target, replacement)

with open('backend/tests/conftest.py', 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated conftest.py successfully")
