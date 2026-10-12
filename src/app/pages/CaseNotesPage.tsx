import { useState } from "react";
import { Plus, StickyNote, Pencil, Trash2 } from "lucide-react";
import type { CaseNote, PwdProfile } from "../data/mockData";
import { useApi } from "../lib/useApi";
import { api } from "../lib/api";

export function CaseNotesPage() {
  const { data, loading, error, refetch } = useApi<CaseNote[]>("/case-notes");
  const notes = data ?? [];
  const [showAdd, setShowAdd] = useState(false);
  const { data: profileData } = useApi<PwdProfile[]>("/pwd-profiles");
  const profiles = profileData ?? [];
  const [newNote, setNewNote] = useState({ pwdId: "", text: "" });
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function addNote() {
    if (!newNote.pwdId || !newNote.text.trim()) return;
    setSaving(true);
    setActionError(null);
    try {
      await api.post("/case-notes", { pwdId: newNote.pwdId, note: newNote.text });
      setNewNote({ pwdId: "", text: "" });
      setShowAdd(false);
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not save the note.");
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(id: string) {
    if (!editText.trim()) return;
    setSaving(true);
    setActionError(null);
    try {
      await api.patch(`/case-notes/${id}`, { note: editText });
      setEditId(null);
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not update the note.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete(id: string) {
    setSaving(true);
    setActionError(null);
    try {
      await api.del(`/case-notes/${id}`);
      setDeleteId(null);
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not delete the note.");
    } finally {
      setSaving(false);
    }
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

      {actionError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
          {actionError}
        </div>
      )}

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
                  <option value="">— Select a PWD —</option>
                  {profiles.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
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
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-900 text-white text-sm rounded-lg hover:bg-blue-800 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save Note"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete this note?</h2>
            <p className="text-sm text-gray-500 mb-5">This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(deleteId)}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-60"
              >
                {saving ? "Deleting…" : "Delete"}
              </button>
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
              <div className="flex items-center gap-1 flex-shrink-0">
                {editId === note.id ? null : (
                  <>
                    <button
                      onClick={() => { setEditId(note.id); setEditText(note.note); }}
                      title="Edit Note"
                      className="p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-700 rounded transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteId(note.id)}
                      title="Delete Note"
                      className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
                <StickyNote size={16} className="text-gray-300 flex-shrink-0 ml-1" />
              </div>
            </div>
            {editId === note.id ? (
              <div className="space-y-3">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setEditId(null)}
                    className="px-3 py-1.5 border border-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => saveEdit(note.id)}
                    disabled={saving}
                    className="px-3 py-1.5 bg-blue-900 text-white text-xs rounded-lg hover:bg-blue-800 disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-700 leading-relaxed">{note.note}</p>
            )}
          </div>
        ))}
        {notes.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            {loading ? "Loading…" : error ? error : "No case notes recorded yet."}
          </div>
        )}
      </div>
    </div>
  );
}
