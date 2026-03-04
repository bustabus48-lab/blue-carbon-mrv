import uuid
from sqlalchemy import Column, String, Numeric, Date, Boolean, DateTime, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from geoalchemy2 import Geometry
from .base import Base

class MangrovePlot(Base):
    __tablename__ = "mangrove_plots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    stratum_name = Column(String(255), nullable=False)
    area_ha = Column(Numeric(10, 2), nullable=False)
    planting_date = Column(Date, nullable=True)
    geom = Column(Geometry('POLYGON', srid=4326), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("timezone('utc'::text, now())"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=text("timezone('utc'::text, now())"), nullable=False)

class LeakageZone(Base):
    __tablename__ = "leakage_zones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    zone_name = Column(String(255), nullable=False)
    area_ha = Column(Numeric(10, 2), nullable=False)
    geom = Column(Geometry('POLYGON', srid=4326), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("timezone('utc'::text, now())"), nullable=False)

class SamplePlot(Base):
    __tablename__ = "sample_plots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    plot_name = Column(String, nullable=False)
    stratum = Column(String, nullable=False)
    status = Column(String, nullable=False, default='Active')
    location = Column(Geometry('POINT', srid=4326), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("timezone('utc'::text, now())"), nullable=False)

class SARChangeAlert(Base):
    __tablename__ = "sar_change_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    alert_type = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False)
    confidence_score = Column(Numeric(5, 2))
    status = Column(String(50), nullable=False, default='Pending Verification')
    detected_area_ha = Column(Numeric(10, 2))
    event_date = Column(Date, nullable=False)
    geom = Column(Geometry('POLYGON', srid=4326), nullable=False)
    assigned_crema_id = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("timezone('utc'::text, now())"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=text("timezone('utc'::text, now())"), nullable=False)


class ProjectArea(Base):
    __tablename__ = "project_areas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    area_name = Column(String, nullable=False)
    area_type = Column(String(50), nullable=False)
    source_file_name = Column(String, nullable=True)
    area_ha = Column(Numeric(12, 2), nullable=True)
    properties = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    geom = Column(Geometry('MULTIPOLYGON', srid=4326), nullable=False)
    uploaded_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("timezone('utc'::text, now())"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=text("timezone('utc'::text, now())"), nullable=False)
