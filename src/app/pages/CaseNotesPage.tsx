import { useState } from "react";
import { Plus, StickyNote } from "lucide-react";
import { PWD_PROFILES } from "../data/mockData";

interface CaseNote {
  id: string;
  pwdName: string;
  date: string;
  author: string;
  note: string;
}

const SAMPLE_NOTES: CaseNote[] = [
  { id: "cn001", pwdName: "Luisa Magbanua", date: "2026-05-10", author: "Pedro Lim", note: "Visited home. PWD has difficulty moving around due to damaged wheelchair. Caregiver (spouse) is also experiencing back pain. Recommended referral for wheelchair repair." },
  { id: "cn002", pwdName: "Fernando Navarro", date: "2026-03-15", author: "Pedro Lim", note: "Home visit conducted. PWD lives alone. Hypertension untreated for over 6 months. Hearing aid is broken — communication was very difficult. No social support observed. Immediate intervention needed." },
  { id: "cn003", pwdName: "Cynthia Mercado", date: "2026-05-30", author: "Ana Cruz", note: "Case reviewed following barangay staff report. Family support is limited. PWD shows signs of social withdrawal. Referred to CSWD for psychosocial support services." },
];

export function CaseNotesPage() {
  const [notes, setNotes] = useState<CaseNote[]>(SAMPLE_NOTES);
  const [showAdd, setShowAdd] = useState(false);
  const [newNote, setNewNote] = useState({ pwdId: PWD_PROFILES[0].id, text: "" });

  function addNote() {
    const pwd = PWD_PROFILES.find((p) => p.id === newNote.pwdId);
    if (!pwd || !newNote.text.trim()) return;
    const note: CaseNote = {
      id: `cn${Date.now()}`,
      pwdName: pwd.fullName,
      date: new Date().toISOString().split("T")[0],
      author: "Ana Cruz",
      note: newNote.text,
    };
    setNotes((prev) => [note, ...prev]);
    setNewNote({ pwdId: PWD_PROFILES[0].id, text: "" });
    setShowAdd(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Case Notes</h1>
          <p className="text-sm text-gray-500 mt-1">Field observations and case-level notes</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white text-sm rounded-lg hover:bg-blue-800 transition-colors"
        >
          <Plus size={16} /> Add Case Note
        </button>
      </div>

      {/* Add Note Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">New Case Note</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-700 mb-1 block">PWD</label>
                <select
                  value={newNote.pwdId}
                  onChange={(e) => setNewNote((n) => ({ ...n, pwdId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  {PWD_PROFILES.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-700 mb-1 block">Note</label>
                <textarea
                  value={newNote.text}
                  onChange={(e) => setNewNote((n) => ({ ...n, text: e.target.value }))}
                  rows={5}
                  placeholder="Write your observation or case note..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAdd(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addNote}
                  className="flex-1 px-4 py-2 bg-blue-900 text-white text-sm rounded-lg hover:bg-blue-800"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {notes.map((note) => (
          <div key={note.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold text-gray-900">{note.pwdName}</div>
                <div className="text-xs text-gray-400 mt-0.5">{note.date} · {note.author}</div>
              </div>
              <StickyNote size={16} className="text-gray-300 flex-shrink-0 mt-1" />
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{note.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
