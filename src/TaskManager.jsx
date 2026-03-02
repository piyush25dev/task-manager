import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase-client";
import "./TaskManager.css";
import { Trash2, Edit2, Plus, CheckCircle, AlertCircle } from "lucide-react";

function TaskManager({ user }) {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [taskImage, setTaskImage] = useState(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("tasks")
        .select("*")
        .eq("email", user.email) // ONLY FETCH USER'S TASKS
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError(`Failed to fetch tasks: ${fetchError.message}`);
        console.error("Fetch error:", fetchError);
      } else {
        setTasks(data || []);
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
  if (!user?.email) return;

  const myChannel = supabase
    .channel("tasks-channel")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "tasks",
        filter: `email=eq.${user.email}`,
      },
      (payload) => {
        const newTask = payload.new;
        setTasks((prev) => [newTask, ...prev]);
      }
    )
    .subscribe((status) => {
      console.log("Subscribed to tasks channel:", status);
    });

  return () => {
    supabase.removeChannel(myChannel);
  };
}, [user?.email]);

  const changeHandler = (e) => {
    const { name, value } = e.target;
    setNewTask((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    let imageUrl = null;

    if (taskImage) {
      imageUrl = await uploadImageToBucket(taskImage);
    }

    // Validation
    if (!newTask.title.trim()) {
      setError("Task title is required");
      return;
    }

    try {
      setLoading(true);

      if (editingId) {
        const updatedTask = {
          ...newTask,
          image_url: imageUrl,
        };

        // Update existing task
        const { error: updateError } = await supabase
          .from("tasks")
          .update(updatedTask)
          .eq("id", editingId)
          .eq("email", user.email);

        if (updateError) {
          setError(`Failed to update task: ${updateError.message}`);
        } else {
          setSuccess("Task updated successfully!");
          setNewTask({ title: "", description: "", image_url: "" });
          setEditingId(null);
          await fetchTasks();
        }
      } else {
        const taskWithUser = {
          ...newTask,
          email: user.email,
          image_url: imageUrl,
        };

        const { error: insertError } = await supabase
          .from("tasks")
          .insert([taskWithUser]);

        if (insertError) {
          setError(`Failed to add task: ${insertError.message}`);
        } else {
          setSuccess("Task added successfully!");
          setNewTask({ title: "", description: "" });
          await fetchTasks();
        }
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (task) => {
    setNewTask({ title: task.title, description: task.description });
    setEditingId(task.id);
  };

  const handleCancel = () => {
    setNewTask({ title: "", description: "" });
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      setLoading(true);
      const { error: deleteError } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id)
        .eq("email", user.email); // Only owner can delete

      if (deleteError) {
        setError(`Failed to delete task: ${deleteError.message}`);
      } else {
        setSuccess("Task deleted successfully!");
        await fetchTasks();
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  const uploadImageToBucket = async (file) => {
    const filePath = `${file.name}-${Date.now()}`;

    const { error } = await supabase.storage
      .from("tasks-buckets")
      .upload(filePath, file);
    if (error) {
      console.log("error uploading file:", error.message);
      throw error;
    }

    const { data } = await supabase.storage
      .from("tasks-buckets")
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setTaskImage(e.target.files[0]);
    }
  };

  // Auto-hide messages after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <div className="app-wrapper">
      <div className="task-container">
        <div className="header">
          <h1 className="task-title">Task Manager</h1>
          <p className="subtitle">Stay organized and productive</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}
        {success && (
          <div className="alert alert-success">
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-group">
            <input
              type="text"
              value={newTask.title}
              placeholder="What needs to be done?"
              className="task-input"
              name="title"
              onChange={changeHandler}
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <input
              type="file"
              accept="image/*"
              placeholder="Upload a file"
              className="task-input"
              name="file"
              onChange={handleFileChange}
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <textarea
              value={newTask.description}
              placeholder="Add details or notes..."
              className="task-textarea"
              name="description"
              onChange={changeHandler}
              disabled={loading}
              rows="3"
            />
          </div>
          <div className="form-actions">
            <button
              type="submit"
              className="task-button task-button-primary"
              disabled={loading}
            >
              <Plus size={18} />
              {editingId ? "Update Task" : "Add Task"}
            </button>
            {editingId && (
              <button
                type="button"
                className="task-button task-button-secondary"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Task List */}
        <div className="task-list">
          {loading && tasks.length === 0 ? (
            <div className="empty-state">
              <p>Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="empty-state">
              <p>No tasks yet. Create one to get started! 🚀</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="task-card">
                <div className="task-info">
                  <h2>{task.title}</h2>
                  {task.description && <p>{task.description}</p>}
                  {task.image_url && (
                    <img
                      src={task.image_url}
                      alt="Task Attachment"
                      className="task-image"
                    />
                  )}
                </div>
                <div className="task-actions">
                  <button
                    className="task-edit"
                    onClick={() => handleEdit(task)}
                    disabled={loading}
                    title="Edit task"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    className="task-delete"
                    onClick={() => handleDelete(task.id)}
                    disabled={loading}
                    title="Delete task"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskManager;
