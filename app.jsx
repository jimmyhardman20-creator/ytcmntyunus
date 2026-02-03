import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  UserRound, 
  Hash, 
  PlusCircle, 
  Trash2, 
  Play, 
  MessageSquare,
  Clock,
  Youtube,
  Wifi,
  WifiOff,
  Users,
  Activity
} from 'lucide-react';
import { io } from 'socket.io-client';

// Render URL auto-detection
const SERVER_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001' 
  : window.location.origin;

const socket = io(SERVER_URL);

const App = () => {
  const [view, setView] = useState('dashboard');
  const [comments, setComments] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [newJobUrl, setNewJobUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    // Real-time data sync listeners
    socket.on('new_comment', (comment) => {
      setComments(prev => [comment, ...prev]);
    });

    socket.on('new_job', (job) => {
      setJobs(prev => [job, ...prev]);
    });

    socket.on('worker_update', (workerList) => {
      setWorkers(workerList);
    });

    socket.on('clear_comments', () => {
      setComments([]);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('new_comment');
      socket.off('new_job');
      socket.off('worker_update');
      socket.off('clear_comments');
    };
  }, []);

  // Filter logic
  const filteredData = useMemo(() => {
    const uniqueUsers = new Set();
    const general = [];
    const numbered = [];

    [...comments].reverse().forEach(item => {
      const name = item.userName?.toLowerCase().trim();
      if (name && !uniqueUsers.has(name)) {
        uniqueUsers.add(name);
        const hasNum = /\d+/.test(item.text);
        if (hasNum) numbered.push(item);
        else general.push(item);
      }
    });

    return { general: general.reverse(), numbered: numbered.reverse() };
  }, [comments]);

  const addJob = async (e) => {
    e.preventDefault();
    if (!newJobUrl) return;
    setLoading(true);
    try {
      await fetch(`${SERVER_URL}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newJobUrl })
      });
      setNewJobUrl('');
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const clearData = async () => {
    if (!window.confirm("Sob data muche felte chan?")) return;
    await fetch(`${SERVER_URL}/api/comments`, { method: 'DELETE' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Top Header */}
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 p-2 rounded-xl text-white shadow-lg">
            <Youtube size={24} />
          </div>
          <h1 className="text-xl font-extrabold hidden md:block">YT Stream Admin</h1>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-full border">
          <button onClick={() => setView('dashboard')} className={`px-5 py-1.5 rounded-full text-sm font-bold transition-all ${view === 'dashboard' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500'}`}>Dashboard</button>
          <button onClick={() => setView('jobs')} className={`px-5 py-1.5 rounded-full text-sm font-bold transition-all ${view === 'jobs' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500'}`}>Jobs & Workers</button>
        </div>

        <button onClick={clearData} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
          <Trash2 size={20} />
        </button>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {view === 'dashboard' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Unique Comments */}
            <div className="space-y-4">
              <h2 className="flex items-center justify-between font-bold text-lg text-slate-700">
                <span className="flex items-center gap-2"><MessageSquare className="text-blue-500" /> Unique List</span>
                <span className="bg-blue-100 text-blue-700 px-3 py-0.5 rounded-full text-xs font-black">{filteredData.general.length}</span>
              </h2>
              <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
                {filteredData.general.length === 0 && (
                  <div className="bg-white p-12 text-center text-slate-400 border-2 border-dashed rounded-3xl italic">Kono unique comment ekhono asheni.</div>
                )}
                {filteredData.general.map(c => (
                  <div key={c.id} className="bg-white p-4 rounded-2xl border shadow-sm flex gap-4 hover:border-blue-200 transition-all group">
                    <div className="bg-blue-50 h-10 w-10 rounded-full flex items-center justify-center text-blue-600 font-bold group-hover:bg-blue-100">
                      {c.userName?.[0]?.toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-sm text-slate-900 truncate">{c.userName}</h4>
                      <p className="text-slate-600 text-sm mt-0.5 break-words">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Number Priority */}
            <div className="space-y-4">
              <h2 className="flex items-center justify-between font-bold text-lg text-slate-700">
                <span className="flex items-center gap-2"><Hash className="text-emerald-500" /> Priority (Numbers)</span>
                <span className="bg-emerald-100 text-emerald-700 px-3 py-0.5 rounded-full text-xs font-black">{filteredData.numbered.length}</span>
              </h2>
              <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-2">
                {filteredData.numbered.length === 0 && (
                  <div className="bg-white p-12 text-center text-slate-400 border-2 border-dashed rounded-3xl italic">Numbers thaka kono comment asheni.</div>
                )}
                {filteredData.numbered.map(c => (
                  <div key={c.id} className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 shadow-sm flex gap-4">
                    <div className="bg-emerald-100 h-10 w-10 rounded-full flex items-center justify-center text-emerald-600 flex-shrink-0">
                      <Hash size={18} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-sm text-emerald-900 truncate">{c.userName}</h4>
                        <span className="text-[10px] font-mono text-emerald-500 bg-white px-1.5 py-0.5 rounded border border-emerald-100">
                          {c.timestamp?.toLocaleTimeString ? c.timestamp.toLocaleTimeString() : 'Recent'}
                        </span>
                      </div>
                      <p className="text-emerald-800 text-sm mt-2 bg-white/80 p-3 rounded-xl font-medium border border-emerald-100/50">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Job & Worker Management */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Left: Job Creator */}
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <PlusCircle className="text-blue-500" /> Scrape Job Create
                </h3>
                <form onSubmit={addJob} className="flex flex-col gap-3">
                  <input 
                    type="url" 
                    value={newJobUrl}
                    onChange={e => setNewJobUrl(e.target.value)}
                    placeholder="Paste YouTube Live URL..."
                    className="px-5 py-3 rounded-xl border outline-none focus:ring-4 focus:ring-blue-500/10"
                    required
                  />
                  <button disabled={loading} className="bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                    {loading ? 'Processing...' : 'Add to Scrape Queue'}
                  </button>
                </form>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-slate-700 flex items-center gap-2"><Clock size={18}/> Pending Queue</h3>
                <div className="space-y-3">
                  {jobs.length === 0 && <p className="text-center p-6 bg-white rounded-2xl text-slate-400 border border-dashed">No pending jobs.</p>}
                  {jobs.map(j => (
                    <div key={j.id} className="bg-white p-4 rounded-2xl border flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="bg-amber-100 p-2.5 rounded-lg text-amber-600"><Youtube size={18}/></div>
                        <p className="text-xs font-bold truncate max-w-[150px]">{j.url}</p>
                      </div>
                      <span className="text-[9px] font-black uppercase bg-amber-50 px-2.5 py-1 rounded-full text-amber-600 border border-amber-100">{j.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Active Workers List */}
            <div className="space-y-6">
              <div className="bg-slate-900 p-8 rounded-3xl shadow-xl text-white border border-slate-800">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Users className="text-blue-400" /> Active Workers
                </h3>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {workers.length === 0 && (
                    <div className="py-10 text-center text-slate-500 italic border border-dashed border-slate-700 rounded-2xl">
                      Kono worker ekhono connect hoyni.
                    </div>
                  )}
                  {workers.map(w => (
                    <div key={w.id} className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="bg-blue-900/50 p-2.5 rounded-xl text-blue-400">
                            <Activity size={20} />
                          </div>
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800"></div>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{w.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: {w.id.slice(0, 10)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black uppercase tracking-widest text-green-400 bg-green-400/10 px-2 py-1 rounded-lg">Online</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                <p className="text-xs text-blue-700 leading-relaxed italic">
                  <b>Worker Tip:</b> Extension connect hole auto eikhane status update hobe. Worker proti second-e queue theke job check korbe.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Connectivity Status */}
      <div className="fixed bottom-6 left-6 bg-slate-900 text-white px-5 py-2.5 rounded-full flex items-center gap-3 shadow-2xl border border-slate-700">
        <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
        <span className="text-[10px] font-bold uppercase tracking-widest">
          {isConnected ? 'Main Server Online' : 'Server Offline'}
        </span>
      </div>
    </div>
  );
};

export default App;
