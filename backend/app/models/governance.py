import uuid
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, text, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from .base import Base


class IngestionJob(Base):
    __tablename__ = "ingestion_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    job_type = Column(String, nullable=False)
    filename = Column(String, nullable=False)
    file_hash = Column(String, nullable=True)
    status = Column(String, nullable=False, default='queued')
    uploaded_by = Column(UUID(as_uuid=True), nullable=True)
    reviewed_by = Column(UUID(as_uuid=True), nullable=True)
    validation_errors = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    audit_log = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    created_at = Column(DateTime(timezone=True), server_default=text("timezone('utc'::text, now())"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=text("timezone('utc'::text, now())"), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    project = relationship("Project")


class ClassificationRun(Base):
    __tablename__ = "classification_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    run_type = Column(String, nullable=False)
    status = Column(String, nullable=False, default='running')
    tiles_processed = Column(Integer, default=0)
    alerts_generated = Column(Integer, default=0)
    cloud_cover_avg = Column(Numeric, nullable=True)
    error_message = Column(String, nullable=True)
    qa_accuracy = Column(Numeric, nullable=True)
    started_at = Column(DateTime(timezone=True), server_default=text("timezone('utc'::text, now())"), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Integer, nullable=True)

    project = relationship("Project")
