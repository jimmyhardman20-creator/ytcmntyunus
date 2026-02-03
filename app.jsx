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
  WifiOff
} from 'lucide-react';
import { io } from 'socket.io-client';

// Render URL (Deploy korar por eikhane apnar Render URL ti boshaben)
const SERVER_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001' 
  : window.location.origin;

const socket = io(SERVER_URL);

const App = () => {
  const [view, setView] = useState('dashboard');
  const [comments, setComments] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [newJobUrl, setNewJobUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    // Socket connection listeners
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    // Real-time data sync
    socket.on('new_comment', (comment) => {
      setComments(prev => [comment, ...prev]);
    });

    socket.on('new_job', (job) => {
      setJobs(prev => [job, ...prev]);
    });

    socket.on('clear_comments', () => {
      setComments([]);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('new_comment');
      socket.off('new_job');
      socket.off('clear_comments');
    };
  }, []);

  // Filter logic: Unique user check ebong Numbers alada kora
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
      {/* Header */}
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 p-2 rounded-xl text-white shadow-lg">
            <Youtube size={24} />
          </div>
          <h1 className="text-xl font-extrabold hidden sm:block">Render Stream Manager</h1>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-full border">
          <button onClick={() => setView('dashboard')} className={`px-5 py-1.5 rounded-full text-sm font-bold transition-all ${view === 'dashboard' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500'}`}>Dashboard</button>
          <button onClick={() => setView('jobs')} className={`px-5 py-1.5 rounded-full text-sm font-bold transition-all ${view === 'jobs' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500'}`}>Job Control</button>
        </div>

        <button onClick={clearData} className="p-2 text-slate-400 hover:text-red-500">
          <Trash2 size={20} />
        </button>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {view === 'dashboard' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* General Comments */}
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 font-bold text-lg text-slate-700">
                <MessageSquare className="text-blue-500" /> Unique Comments ({filteredData.general.length})
              </h2>
              <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
                {filteredData.general.length === 0 && (
                  <div className="bg-white p-10 text-center text-slate-400 border-2 border-dashed rounded-3xl">Kono unique comment asheni.</div>
                )}
                {filteredData.general.map(c => (
                  <div key={c.id} className="bg-white p-4 rounded-2xl border shadow-sm flex gap-4">
                    <div className="bg-blue-50 h-10 w-10 rounded-full flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                      {c.userName?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{c.userName}</h4>
                      <p className="text-slate-600 text-sm mt-0.5">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Number Priority */}
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 font-bold text-lg text-slate-700">
                <Hash className="text-emerald-500" /> Number Priority ({filteredData.numbered.length})
              </h2>
              <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-2">
                {filteredData.numbered.length === 0 && (
                  <div className="bg-white p-10 text-center text-slate-400 border-2 border-dashed rounded-3xl">Numbers thaka kono comment asheni.</div>
                )}
                {filteredData.numbered.map(c => (
                  <div key={c.id} className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 shadow-sm flex gap-4">
                    <div className="bg-emerald-100 h-10 w-10 rounded-full flex items-center justify-center text-emerald-600 flex-shrink-0">
                      <Hash size={18} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-emerald-900">{c.userName}</h4>
                      <p className="text-emerald-800 text-sm mt-1 bg-white/60 p-2 rounded-lg font-medium">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Job Control */
          <div className="max-w-xl mx-auto space-y-8">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
              <h3 className="text-xl font-bold mb-2">Create New Scrape Job</h3>
              <p className="text-slate-500 text-sm mb-6">Extension auto-job request pathabe. URL-ti add korun.</p>
              <form onSubmit={addJob} className="flex flex-col gap-3">
                <input 
                  type="url" 
                  value={newJobUrl}
                  onChange={e => setNewJobUrl(e.target.value)}
                  placeholder="Paste YouTube Live URL..."
                  className="px-5 py-3 rounded-xl border outline-none focus:ring-4 focus:ring-blue-500/10"
                  required
                />
                <button disabled={loading} className="bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">
                  {loading ? 'Creating...' : 'Push to Queue'}
                </button>
              </form>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-slate-700 flex items-center gap-2"><Clock size={18}/> Pending Jobs</h3>
              {jobs.length === 0 && (
                <div className="p-8 text-center text-slate-400 bg-white border rounded-2xl italic">Queue-te kono job nei.</div>
              )}
              {jobs.map(j => (
                <div key={j.id} className="bg-white p-5 rounded-2xl border flex items-center justify-between">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="bg-amber-100 p-3 rounded-lg text-amber-600"><Clock size={20}/></div>
                    <p className="text-sm font-bold truncate max-w-[250px]">{j.url}</p>
                  </div>
                  <span className="text-[10px] font-black uppercase bg-amber-100 px-3 py-1 rounded-full text-amber-700">{j.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Connection Indicator */}
      <div className="fixed bottom-6 left-6 bg-slate-900 text-white px-4 py-2 rounded-full flex items-center gap-3 shadow-2xl border border-slate-700">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
        <span className="text-[10px] font-bold uppercase tracking-widest">
          {isConnected ? 'Server Connected' : 'Server Offline'}
        </span>
      </div>
    </div>
  );
};

export default App;
