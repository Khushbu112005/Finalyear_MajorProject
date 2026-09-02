"""
Knowledge Graph Document Linker.
Links extracted document entities, acts, sections, and authorities
directly into the Neo4j / Knowledge Graph repository.
"""

from typing import Dict, Any, List
import logging

from backend.app.knowledge.domain.entities import EntityDomainModel, EntityType
from backend.app.knowledge.domain.relationships import RelationshipDomainModel, RelationType
from backend.app.knowledge.graph.repository import graph_repository

logger = logging.getLogger("civicsphere.documents.knowledge_linker")


class DocumentKnowledgeLinker:
    """Links analyzed document metadata and entities to the Knowledge Graph."""

    @staticmethod
    async def link_document_evidence(
        document_id: str,
        filename: str,
        evidence: Dict[str, Any],
        jurisdiction: str = "IN"
    ) -> List[str]:
        """
        Creates a DOCUMENT entity node and edges connecting it to recognized statutory entities.
        Returns list of linked entity IDs.
        """
        linked_node_ids = []

        # 1. Create DOCUMENT entity
        doc_node = EntityDomainModel(
            entity_id=f"ent_doc_{document_id[:12]}",
            name=filename,
            entity_type=EntityType.DOCUMENT,
            jurisdiction=jurisdiction,
            attributes={
                "document_id": document_id,
                "document_type": evidence.get("document_type", "Document"),
                "authority": evidence.get("authority"),
                "confidence": evidence.get("confidence", 1.0),
            }
        )
        graph_repository.insert_entity(doc_node)
        linked_node_ids.append(doc_node.entity_id)

        # 2. Link Legal References (e.g. Acts / Sections)
        for legal_ref in evidence.get("legal_references", []):
            ref_clean = legal_ref.strip()
            # Find matching statutory nodes in the graph
            matching_nodes = graph_repository.find_entities_by_name(ref_clean, limit=3)
            for target_node in matching_nodes:
                rel = RelationshipDomainModel(
                    source_entity_id=doc_node.entity_id,
                    target_entity_id=target_node.entity_id,
                    relation_type=RelationType.CITES,
                    source_id=f"doc_{document_id}",
                    confidence=float(evidence.get("confidence", 1.0)),
                    attributes={"reference_text": legal_ref}
                )
                graph_repository.insert_relationship(rel)
                linked_node_ids.append(target_node.entity_id)

        # 3. Link Authority if present
        authority = evidence.get("authority")
        if authority:
            auth_nodes = graph_repository.find_entities_by_name(authority.strip(), limit=2)
            for auth_node in auth_nodes:
                rel = RelationshipDomainModel(
                    source_entity_id=doc_node.entity_id,
                    target_entity_id=auth_node.entity_id,
                    relation_type=RelationType.ADMINISTERED_BY,
                    source_id=f"doc_{document_id}",
                    confidence=1.0,
                )
                graph_repository.insert_relationship(rel)
                linked_node_ids.append(auth_node.entity_id)

        logger.info(f"Linked document {document_id} to {len(linked_node_ids)} knowledge graph entities.")
        return linked_node_ids


KnowledgeLinker = DocumentKnowledgeLinker

