
import { Save, FileText } from "lucide-react";
import "./StoryEditor.css";

export default function StoryEditor({
  title,
  onTitleChange,
  story,
  onStoryChange,
  onSave,
  saveStatus,
}) {
  const wordCount = story.trim()
    ? story.trim().split(/\s+/).length
    : 0;

  return (
    <section className="story-editor-panel">
      <div className="story-editor-header">
        <div>
          <span className="studio-eyebrow">
            YOUR WRITING SPACE
          </span>
          <h2>Story Editor</h2>
        </div>

        <button
          type="button"
          className="story-save-btn"
          onClick={onSave}
        >
          <Save size={17} />
          Save Draft
        </button>
      </div>

      <label className="studio-field">
        <span>Story Title</span>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Give your story a title"
          maxLength={120}
        />
      </label>

      <label className="studio-field story-content-field">
        <span>Story / Script</span>
        <textarea
          value={story}
          onChange={(e) => onStoryChange(e.target.value)}
          placeholder="Every great story begins somewhere. Start writing..."
          spellCheck
        />
      </label>

      <div className="story-editor-footer">
        <span>
          <FileText size={15} />
          {wordCount} words · {story.length} characters
        </span>

        <span className="story-save-status" role="status">
          {saveStatus}
        </span>
      </div>
    </section>
  );
}
