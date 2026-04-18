import uuid
from sqlalchemy import Column, String, Numeric, Date, DateTime, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from .base import Base

class SocioEconomicObservation(Base):
    __tablename__ = "socio_economic_observations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    coastal_area_name = Column(String, nullable=False)
    community_name = Column(String, nullable=True)
    indicator_code = Column(String, nullable=False)
    indicator_name = Column(String, nullable=False)
    observation_period_start = Column(Date, nullable=False)
    observation_period_end = Column(Date, nullable=False)
    value_numeric = Column(Numeric, nullable=True)
    value_text = Column(String, nullable=True)
    unit = Column(String, nullable=True)
    source_reference = Column(String, nullable=True)
    verified_by = Column(String, nullable=True)
    evidence_link_id = Column(UUID(as_uuid=True), nullable=True)
    metadata_json = Column("metadata", JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    created_at = Column(DateTime(timezone=True), server_default=text("timezone('utc'::text, now())"), nullable=False)

    project = relationship("Project", back_populates="socio_economic_observations")

class EnvironmentalPressureObservation(Base):
    __tablename__ = "environmental_pressure_observations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    coastal_area_name = Column(String, nullable=False)
    pressure_type = Column(String, nullable=False)
    severity = Column(String, nullable=True)
    observation_date = Column(Date, nullable=False, server_default=text("CURRENT_DATE"))
    geometry = Column(Geometry('MULTIPOLYGON', srid=4326), nullable=True)
    estimated_impacted_area_ha = Column(Numeric(10, 2), nullable=True)
    source_reference = Column(String, nullable=True)
    verified_by = Column(String, nullable=True)
    evidence_link_id = Column(UUID(as_uuid=True), nullable=True)
    notes = Column(String, nullable=True)
    metadata_json = Column("metadata", JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    created_at = Column(DateTime(timezone=True), server_default=text("timezone('utc'::text, now())"), nullable=False)

    project = relationship("Project", back_populates="environmental_pressure_observations")
