import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useRestoreCategory,
} from "@/features/settings/api";
import { Pencil, Trash2, Plus, Check, X, RotateCcw } from "lucide-react";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e",
  "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6",
  "#d946ef", "#f43f5e", "#78716c", "#374151",
];

interface InlineEditState {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export function CategoryManager() {
  const { data: categories = [] } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const restoreCategory = useRestoreCategory();

  const [adding, setAdding] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", color: "#6366f1", icon: "📁" });
  const [editing, setEditing] = useState<InlineEditState | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const activeCategories = categories.filter((c) => !c.isDeleted);
  const deletedCategories = categories.filter((c) => c.isDeleted);

  const handleCreate = () => {
    if (!newCategory.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    createCategory.mutate(
      { name: newCategory.name.trim(), color: newCategory.color, icon: newCategory.icon },
      {
        onSuccess: () => {
          toast.success("Category created");
          setAdding(false);
          setNewCategory({ name: "", color: "#6366f1", icon: "📁" });
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to create category");
        },
      }
    );
  };

  const handleUpdate = () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    updateCategory.mutate(
      {
        id: editing.id,
        data: { name: editing.name.trim(), color: editing.color, icon: editing.icon },
      },
      {
        onSuccess: () => {
          toast.success("Category updated");
          setEditing(null);
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to update category");
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    deleteCategory.mutate(id, {
      onSuccess: () => {
        toast.success("Category deleted");
        setDeletingId(null);
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to delete category");
        setDeletingId(null);
      },
    });
  };

  const handleRestore = (id: string) => {
    restoreCategory.mutate(id, {
      onSuccess: () => {
        toast.success("Category restored");
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to restore category");
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Categories</h3>
        {!adding && (
          <Button onClick={() => setAdding(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        )}
      </div>

      {adding && (
        <Card className="border-dashed">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={newCategory.name}
                  onChange={(e) => setNewCategory((c) => ({ ...c, name: e.target.value }))}
                  placeholder="Category name"
                />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <Input
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory((c) => ({ ...c, icon: e.target.value }))}
                  placeholder="Emoji icon"
                  maxLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Select
                  value={newCategory.color}
                  onValueChange={(v) => setNewCategory((c) => ({ ...c, color: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESET_COLORS.map((color) => (
                      <SelectItem key={color} value={color}>
                        <span className="flex items-center gap-2">
                          <span
                            className="h-4 w-4 rounded-full inline-block border"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-xs font-mono">{color}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setAdding(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreate} disabled={createCategory.isPending}>
                {createCategory.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {activeCategories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/30 transition-colors"
          >
            {editing?.id === cat.id ? (
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <Input
                  value={editing.name}
                  onChange={(e) => setEditing((e2) => e2 && { ...e2, name: e.target.value })}
                  placeholder="Name"
                />
                <Input
                  value={editing.icon}
                  onChange={(e) => setEditing((e2) => e2 && { ...e2, icon: e.target.value })}
                  placeholder="Icon"
                  maxLength={2}
                />
                <Select
                  value={editing.color}
                  onValueChange={(v) => setEditing((e2) => e2 && { ...e2, color: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Color" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESET_COLORS.map((color) => (
                      <SelectItem key={color} value={color}>
                        <span className="flex items-center gap-2">
                          <span
                            className="h-4 w-4 rounded-full inline-block border"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-xs font-mono">{color}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span
                  className="h-4 w-4 rounded-full inline-block border"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-lg">{cat.icon || "•"}</span>
                <span className="font-medium">{cat.name}</span>
                {cat.isDefault && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    Default
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              {editing?.id === cat.id ? (
                <>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleUpdate}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditing(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      setEditing({
                        id: cat.id,
                        name: cat.name,
                        color: cat.color,
                        icon: cat.icon || "📁",
                      })
                    }
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(cat.id)}
                    disabled={deletingId === cat.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}

        {activeCategories.length === 0 && (
          <p className="text-sm text-muted-foreground">No categories yet.</p>
        )}
      </div>

      {/* Note: Deleted categories section — the current API only returns active categories,
          so this section will remain empty unless the backend is updated to include deleted ones. */}
      {deletedCategories.length > 0 && (
        <div className="space-y-2 pt-4 border-t">
          <h4 className="text-sm font-medium text-muted-foreground">Deleted Categories</h4>
          {deletedCategories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between p-3 border rounded-md opacity-60"
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-4 w-4 rounded-full inline-block border"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-lg">{cat.icon || "•"}</span>
                <span className="font-medium">{cat.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={() => handleRestore(cat.id)}
              >
                <RotateCcw className="h-4 w-4" />
                Restore
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
