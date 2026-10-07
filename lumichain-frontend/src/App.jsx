import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Map, 
  AlertTriangle, 
  Settings, 
  Users, 
  Zap, 
  ShieldCheck, 
  BarChart, 
  Cpu, 
  Server,
  ArrowRight,
  CheckCircle2,
  AlertOctagon
} from 'lucide-react';

const Sidebar = () => (
  <aside className="sidebar">
    <div className="brand">
      <Zap className="brand-icon" size={24} />
      <span>LumiChain</span>
    </div>
    <nav className="nav-menu">
      <a className="nav-item active"><Activity size={18} /> Overview</a>
      <a className="nav-item"><Map size={18} /> Streetlights</a>
      <a className="nav-item"><AlertTriangle size={18} /> Faults</a>
      <a className="nav-item"><Settings size={18} /> Maintenance</a>
      <a className="nav-item"><Users size={18} /> Technicians</a>
      <a className="nav-item"><ShieldCheck size={18} /> Blockchain</a>
      <a className="nav-item"><BarChart size={18} /> Analytics</a>
      <a className="nav-item"><Zap size={18} /> Energy</a>
      <a className="nav-item"><Users size={18} /> Citizens</a>
    </nav>
  </aside>
);

const Header = () => (
  <header className="header">
    <h1>Smart Streetlight Command Center</h1>
    <div className="header-status">
      <div className="status-dot"></div>
      LIVE SYSTEM
    </div>
  </header>
);

const App = () => {
  const [scene, setScene] = useState(0);
  
  // Dynamic state based on scene
  const isFaulty = scene >= 1 && scene < 6;
  const showConsensus = scene >= 2;
  const showAI = scene >= 3;
  const showComplaint = scene >= 4;
  const showRepair = scene >= 5;
  const isRepaired = scene >= 6;
  const showBlockchain = scene >= 7;
  const isTampered = scene >= 8;

  const kpis = {
    total: 3,
    operational: isFaulty ? 2 : 3,
    faults: isFaulty ? 1 : 0,
    critical: isFaulty ? 1 : 0
  };

  const node2 = {
    status: isFaulty ? 'FAULT' : 'NORMAL',
    lamp: isFaulty ? 'OFF' : 'ON',
    current: isFaulty ? '0.02 A' : (isRepaired ? '0.43 A' : '0.45 A'),
    voltage: '229 V',
    ldr: '96 lux',
    temp: '31.2°C'
  };

  // Auto-advance scenes for the demo (simulated flow)
  const advanceScene = () => {
    if (scene < 8) setScene(s => s + 1);
    else setScene(0); // Reset
  };

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Header />
        
        <div className="dashboard-grid">
          {/* Top KPIs */}
          <div className="kpi-row">
            <div className="glass-panel interactive">
              <div className="panel-title"><Map size={16} /> Total Streetlights</div>
              <div className="kpi-value">{kpis.total}</div>
            </div>
            <div className="glass-panel interactive" style={{ borderBottom: kpis.operational === 3 ? '3px solid var(--success)' : '' }}>
              <div className="panel-title"><CheckCircle2 size={16} /> Operational</div>
              <div className="kpi-value" style={{ color: 'var(--success)' }}>{kpis.operational}</div>
            </div>
            <div className="glass-panel interactive" style={{ borderBottom: kpis.faults > 0 ? '3px solid var(--warning)' : '' }}>
              <div className="panel-title"><AlertTriangle size={16} /> Faults</div>
              <div className="kpi-value" style={{ color: kpis.faults > 0 ? 'var(--warning)' : 'inherit' }}>{kpis.faults}</div>
            </div>
            <div className="glass-panel interactive" style={{ borderBottom: kpis.critical > 0 ? '3px solid var(--danger)' : '' }}>
              <div className="panel-title"><AlertOctagon size={16} /> Critical</div>
              <div className="kpi-value" style={{ color: kpis.critical > 0 ? 'var(--danger)' : 'inherit' }}>{kpis.critical}</div>
            </div>
          </div>

          {/* Live Map */}
          <div className="glass-panel map-section fade-in">
            <div className="panel-title"><Map size={16} /> Live Streetlight Map</div>
            <div className="map-container">
              <div className="street-line"></div>
              <div className="nodes-container">
                <div className="map-node">
                  <div className="node-icon normal"><Zap size={24} /></div>
                  <div className="node-label">NODE-001</div>
                </div>
                
                <div className="map-node">
                  <div className={`node-icon ${isFaulty ? 'fault' : 'normal'}`}><Zap size={24} /></div>
                  <div className="node-label">NODE-002</div>
                </div>
                
                <div className="map-node">
                  <div className="node-icon normal"><Zap size={24} /></div>
                  <div className="node-label">NODE-003</div>
                </div>
              </div>
            </div>
            
            {/* Fault Info Overlay */}
            {isFaulty && (
              <div className="fade-in" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(0,0,0,0.8)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--danger)' }}>
                <div style={{ color: 'var(--danger)', fontWeight: 'bold', marginBottom: '0.5rem' }}>🔴 NODE-002 FAULT</div>
                <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span>Lamp: <span style={{color: 'var(--danger)'}}>OFF</span></span>
                  <span>Current: 0.02 A</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Side Panels */}
          <div className="side-panel">
            {/* Live Sensor Panel */}
            <div className="glass-panel fade-in">
              <div className="panel-title"><Server size={16} /> Live Sensor Panel (Node-002)</div>
              <div className="sensor-grid">
                <div className="sensor-box">
                  <div className="label">CURRENT</div>
                  <div className="value" style={{ color: isFaulty ? 'var(--danger)' : 'var(--success)' }}>
                    {node2.current} <span className="unit"></span>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: isFaulty ? '5%' : '85%', background: isFaulty ? 'var(--danger)' : 'var(--success)' }}></div></div>
                </div>
                <div className="sensor-box">
                  <div className="label">LIGHT OUTPUT</div>
                  <div className="value" style={{ color: isFaulty ? 'var(--danger)' : 'var(--success)' }}>{node2.lamp}</div>
                </div>
                <div className="sensor-box">
                  <div className="label">AMBIENT LIGHT</div>
                  <div className="value">{node2.ldr}</div>
                </div>
                <div className="sensor-box">
                  <div className="label">TEMPERATURE</div>
                  <div className="value">{node2.temp}</div>
                </div>
              </div>
            </div>

            {/* AI Diagnosis */}
            {showAI && (
              <div className="glass-panel ai-diagnosis fade-in">
                <div className="panel-title" style={{ color: '#d8b4fe' }}><Cpu size={16} /> AI Insight</div>
                <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Potential lamp failure detected</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span>Confidence: <span style={{ color: 'var(--success)' }}>94%</span></span>
                  <span>Severity: <span className="badge high">HIGH</span></span>
                </div>
                <div className="ai-reasoning">
                  <ul style={{ listStyle: 'none' }}>
                    <li><ArrowRight size={14} color="#a855f7" /> Current consumption below expected range</li>
                    {showConsensus && <li><ArrowRight size={14} color="#a855f7" /> Neighboring nodes remain operational</li>}
                  </ul>
                </div>
              </div>
            )}

            {/* Complaint Center & Repair */}
            {showComplaint && !showRepair && (
              <div className="glass-panel fade-in" style={{ borderLeft: '4px solid var(--warning)' }}>
                <div className="panel-title">Auto Complaint Center</div>
                <div style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                  <strong>ID:</strong> LC-2026-0042<br/>
                  <strong>Issue:</strong> Lamp Failure<br/>
                  <strong>Location:</strong> Pole 02, Sector A
                </div>
                <button className="action-btn primary" onClick={advanceScene}>SEND TO MUNICIPALITY &rarr;</button>
              </div>
            )}

            {showRepair && !isRepaired && (
              <div className="glass-panel fade-in" style={{ borderLeft: '4px solid var(--primary)' }}>
                <div className="panel-title"><Settings size={16} /> Technician Control</div>
                <div style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                  Assigned: <strong>Ravi Kumar</strong><br/>
                  Distance: 250m<br/>
                  Status: <strong>Repair in progress</strong>
                </div>
                <button className="action-btn primary" onClick={advanceScene}>REPAIR COMPLETED</button>
              </div>
            )}

            {isRepaired && (
              <div className="glass-panel fade-in" style={{ borderLeft: '4px solid var(--success)' }}>
                <div className="panel-title" style={{ color: 'var(--success)' }}><CheckCircle2 size={16} /> IoT Verification</div>
                <div style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                  System verified sensor restoration.<br/><br/>
                  Current: 0.02A &rarr; <strong>0.43A</strong><br/>
                  Lamp: OFF &rarr; <strong>ON</strong>
                </div>
                {!showBlockchain && <button className="action-btn primary" onClick={advanceScene}>VIEW BLOCKCHAIN AUDIT &rarr;</button>}
              </div>
            )}
          </div>
          
          {/* Bottom Area - Blockchain & Consensus */}
          {showConsensus && !isRepaired && (
            <div className="glass-panel fade-in" style={{ gridColumn: 'span 6' }}>
              <div className="panel-title"><Activity size={16} /> Neighbor Verification Consensus</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
                <div style={{ textAlign: 'center' }}><div>NODE-001</div><span className="badge normal">NORMAL</span></div>
                <ArrowRight size={20} color="var(--text-muted)" />
                <div style={{ textAlign: 'center' }}><div>NODE-002</div><span className="badge high">FAILURE</span></div>
                <ArrowRight size={20} color="var(--text-muted)" />
                <div style={{ textAlign: 'center' }}><div>NODE-003</div><span className="badge normal">NORMAL</span></div>
              </div>
              <p style={{ fontSize: '0.875rem', marginTop: '1rem', color: 'var(--text-muted)' }}>
                ✓ Individual pole failure confirmed<br/>✓ Not a neighborhood-wide outage
              </p>
            </div>
          )}

          {showBlockchain && (
            <div className="glass-panel fade-in" style={{ gridColumn: 'span 12' }}>
              <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span><ShieldCheck size={16} /> Blockchain Audit (LC-2026-0042)</span>
                <button 
                  className={`action-btn ${isTampered ? 'danger' : 'primary'}`} 
                  style={{ width: 'auto', padding: '0.25rem 1rem', fontSize: '0.75rem', margin: 0 }}
                  onClick={advanceScene}
                >
                  VERIFY RECORD
                </button>
              </div>
              
              {isTampered ? (
                <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: '8px', color: 'var(--danger)', marginTop: '1rem' }}>
                  <strong>❌ HASH MISMATCH WARNING</strong><br/>
                  Maintenance record has been modified after blockchain anchoring.
                </div>
              ) : (
                <div className="audit-timeline">
                  <div className="audit-item fade-in">
                    <div className="audit-icon"><AlertTriangle size={12} color="white" /></div>
                    <div className="audit-content">
                      <strong>FAULT DETECTED</strong> <span className="audit-time">10:36:21 PM</span><br/>
                      <span className="hash-link">0x7a8b...f92a</span>
                    </div>
                  </div>
                  <div className="audit-item fade-in" style={{ animationDelay: '0.2s' }}>
                    <div className="audit-icon"><Cpu size={12} color="white" /></div>
                    <div className="audit-content">
                      <strong>AI VERIFIED</strong> <span className="audit-time">10:36:24 PM</span><br/>
                      <span className="hash-link">0x4c21...8b1e</span>
                    </div>
                  </div>
                  <div className="audit-item fade-in" style={{ animationDelay: '0.4s' }}>
                    <div className="audit-icon"><CheckCircle2 size={12} color="white" /></div>
                    <div className="audit-content">
                      <strong>REPAIR VERIFIED & CLOSED</strong> <span className="audit-time">10:55:48 PM</span><br/>
                      <span className="hash-link">0x9f33...1d4c</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Demo State Controls */}
      <div className="demo-controls">
        {[0,1,2,3,4,5,6,7,8].map(s => (
          <button 
            key={s} 
            className={`demo-btn ${scene === s ? 'active' : ''}`}
            onClick={() => setScene(s)}
            title={`Scene ${s}`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
};

export default App;
