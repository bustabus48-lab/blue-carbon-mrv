import uuid
from sqlalchemy import Column, String, Numeric, Date, Boolean, DateTime, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from .base import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    name = Column(String(255), nullable=False)
    region = Column(String(255), nullable=True)
    district = Column(String(255), nullable=True)
    project_types = Column(ARRAY(String), nullable=False, server_default=text("'{restoration}'"))
    start_date = Column(Date, nullable=True)
    status = Column(String(50), nullable=False, default='active')
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("timezone('utc'::text, now())"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=text("timezone('utc'::text, now())"), nullable=False)

    # Relationships
    areas = relationship("ProjectArea", back_populates="project", lazy="selectin")
    mangrove_plots = relationship("MangrovePlot", back_populates="project", lazy="selectin")
    alerts = relationship("SARChangeAlert", back_populates="project", lazy="selectin")
    leakage_zones = relationship("LeakageZone", back_populates="project", lazy="selectin")
    sample_plots = relationship("SamplePlot", back_populates="project", lazy="selectin")


class MangrovePlot(Base):
    __tablename__ = "mangrove_plots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    stratum_name = Column(String(255), nullable=False)
    area_ha = Column(Numeric(10, 2), nullable=False)
    planting_date = Column(Date, nullable=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    geom = Column(Geometry('POLYGON', srid=4326), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("timezone('utc'::text, now())"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=text("timezone('utc'::text, now())"), nullable=False)

    project = relationship("Project", back_populates="mangrove_plots")


class LeakageZone(Base):
    __tablename__ = "leakage_zones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    zone_name = Column(String(255), nullable=False)
    area_ha = Column(Numeric(10, 2), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    geom = Column(Geometry('POLYGON', srid=4326), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("timezone('utc'::text, now())"), nullable=False)

    project = relationship("Project", back_populates="leakage_zones")


class SamplePlot(Base):
    __tablename__ = "sample_plots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    plot_name = Column(String, nullable=False)
    stratum = Column(String, nullable=False)
    status = Column(String, nullable=False, default='Active')
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    location = Column(Geometry('POINT', srid=4326), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("timezone('utc'::text, now())"), nullable=False)

    project = relationship("Project", back_populates="sample_plots")


class SARChangeAlert(Base):
    __tablename__ = "sar_change_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    alert_type = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False)
    confidence_score = Column(Numeric(5, 2))
    status = Column(String(50), nullable=False, default='Pending Verification')
    detected_area_ha = Column(Numeric(10, 2))
    event_date = Column(Date, nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    geom = Column(Geometry('POLYGON', srid=4326), nullable=False)
    assigned_crema_id = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("timezone('utc'::text, now())"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=text("timezone('utc'::text, now())"), nullable=False)

    project = relationship("Project", back_populates="alerts")


class ProjectArea(Base):
    __tablename__ = "project_areas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    area_name = Column(String, nullable=False)
    area_type = Column(String(50), nullable=False)
    source_file_name = Column(String, nullable=True)
    area_ha = Column(Numeric(12, 2), nullable=True)
    properties = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    geom = Column(Geometry('MULTIPOLYGON', srid=4326), nullable=False)
    uploaded_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("timezone('utc'::text, now())"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=text("timezone('utc'::text, now())"), nullable=False)

    project = relationship("Project", back_populates="areas")
