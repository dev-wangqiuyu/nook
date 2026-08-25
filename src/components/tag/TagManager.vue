<script setup lang="ts">
// 标签管理区（容器组件，自持数据 + 调 api 层，硬约束 #17 组件不裸跑 SQL）。
// PRD TG-01~TG-05 + S-06：列表（含关联数量）/ 新建（唯一校验）/ 行内改名 / 内联删除确认（级联清理提示）。
// 设计方向 Quiet Stationery：行式清单 + 发丝分隔 + 悬浮显操作，纸本索引卡质感。
import { ref, computed, onMounted } from "vue";
import { Icon } from "@iconify/vue";
import { ElMessage, ElMessageBox } from "element-plus";
import "element-plus/es/components/message/style/css";
import "element-plus/es/components/message-box/style/css";
import {
  listTags,
  createTag,
  updateTag,
  deleteTag,
} from "@/api/tag";
import type { TagWithCount } from "@/types/tag";

const tags = ref<TagWithCount[]>([]);
const loading = ref(true);
const newName = ref("");
const creating = ref(false);
const editingId = ref<number | null>(null);
const editName = ref("");
const confirmingId = ref<number | null>(null);

const total = computed(() => tags.value.length);

async function load(): Promise<void> {
  loading.value = true;
  try {
    tags.value = await listTags();
  } catch (err) {
    ElMessage.error("加载标签失败：" + String(err));
  } finally {
    loading.value = false;
  }
}

async function handleCreate(): Promise<void> {
  const name = newName.value.trim();
  if (!name) return;
  creating.value = true;
  try {
    await createTag(name);
    newName.value = "";
    await load();
  } catch (err) {
    ElMessage.error(String(err));
  } finally {
    creating.value = false;
  }
}

function startEdit(tag: TagWithCount): void {
  editingId.value = tag.id;
  editName.value = tag.name;
}

async function saveEdit(): Promise<void> {
  if (editingId.value === null) return;
  const id = editingId.value;
  try {
    await updateTag(id, editName.value);
    editingId.value = null;
    await load();
  } catch (err) {
    ElMessage.error(String(err));
  }
}

function cancelEdit(): void {
  editingId.value = null;
  editName.value = "";
}

// 删除：内联二次确认（TG-03）。有关联时确认文案警告将清理 N 条关联。
function askDelete(tag: TagWithCount): void {
  confirmingId.value = tag.id;
}

async function confirmDelete(tag: TagWithCount): Promise<void> {
  const associated = tag.task_count + tag.note_count;
  if (associated > 0) {
    try {
      await ElMessageBox.confirm(
        `该标签关联 ${tag.task_count} 条待办、${tag.note_count} 条笔记，删除后将一并清理这些关联记录。`,
        `删除「${tag.name}」？`,
        { confirmButtonText: "删除", cancelButtonText: "保留", type: "warning" }
      );
    } catch {
      confirmingId.value = null;
      return;
    }
  }
  try {
    await deleteTag(tag.id);
    await load();
  } catch (err) {
    ElMessage.error("删除失败：" + String(err));
  } finally {
    confirmingId.value = null;
  }
}

function cancelDelete(): void {
  confirmingId.value = null;
}

onMounted(load);

// v-focus 指令：行内改名时自动聚焦输入框
const vFocus = {
  mounted: (el: HTMLInputElement) => el.focus(),
};
</script>

<template>
  <section class="tag-manager" aria-label="标签管理">
    <header class="tm-head">
      <div class="tm-title-row">
        <Icon icon="lucide:tag" class="tm-title-icon" />
        <h2 class="tm-title">标签</h2>
        <span class="tm-count" v-if="!loading">{{ total }}</span>
      </div>
      <p class="tm-hint">为待办与笔记分类，名称唯一。</p>
    </header>

    <!-- 新建 -->
    <form class="tm-create" @submit.prevent="handleCreate">
      <input
        v-model="newName"
        class="tm-input"
        type="text"
        maxlength="20"
        placeholder="命名一个标签…"
        :disabled="creating"
      />
      <button
        class="tm-add"
        type="submit"
        :disabled="creating || !newName.trim()"
      >
        <Icon icon="lucide:plus" />
        <span>添加</span>
      </button>
    </form>

    <!-- 列表 -->
    <ul class="tm-list" v-if="tags.length > 0">
      <li
        v-for="(t, i) in tags"
        :key="t.id"
        class="tm-row"
        :style="{ '--i': i }"
        :class="{ confirming: confirmingId === t.id }"
      >
        <!-- 名字 / 行内改名 -->
        <div class="tm-name-wrap">
          <template v-if="editingId === t.id">
            <input
              v-model="editName"
              class="tm-input tm-edit-input"
              maxlength="20"
              @keyup.enter="saveEdit"
              @keyup.esc="cancelEdit"
              v-focus
            />
          </template>
          <template v-else>
            <span class="tm-dot" />
            <span class="tm-name">{{ t.name }}</span>
          </template>
        </div>

        <!-- 关联数量 -->
        <div class="tm-counts" v-if="editingId !== t.id">
          <span class="tm-chip" v-if="t.task_count > 0">
            <Icon icon="lucide:list-checks" /> {{ t.task_count }}
          </span>
          <span class="tm-chip" v-if="t.note_count > 0">
            <Icon icon="lucide:notebook" /> {{ t.note_count }}
          </span>
          <span class="tm-chip tm-chip-quiet" v-if="t.task_count === 0 && t.note_count === 0">
            未使用
          </span>
        </div>

        <!-- 操作 -->
        <div class="tm-actions">
          <template v-if="confirmingId === t.id">
            <span class="tm-confirm-text">将清理 {{ t.task_count + t.note_count }} 条关联</span>
            <button class="tm-act tm-act-danger" @click="confirmDelete(t)">
              <Icon icon="lucide:check" /> 确认删除
            </button>
            <button class="tm-act" @click="cancelDelete">
              <Icon icon="lucide:x" /> 取消
            </button>
          </template>
          <template v-else-if="editingId === t.id">
            <button class="tm-act" @click="saveEdit">
              <Icon icon="lucide:check" /> 保存
            </button>
            <button class="tm-act" @click="cancelEdit">
              <Icon icon="lucide:x" />
            </button>
          </template>
          <template v-else>
            <button class="tm-act tm-act-quiet" @click="startEdit(t)" title="重命名">
              <Icon icon="lucide:pencil" />
            </button>
            <button class="tm-act tm-act-quiet tm-act-del" @click="askDelete(t)" title="删除">
              <Icon icon="lucide:trash-2" />
            </button>
          </template>
        </div>
      </li>
    </ul>

    <!-- 空状态 -->
    <div class="tm-empty" v-else-if="!loading">
      <Icon icon="lucide:tag" class="tm-empty-icon" />
      <p class="tm-empty-title">还没有标签</p>
      <p class="tm-empty-sub">为待办与笔记加上分类，从命名一个开始。</p>
    </div>

    <div class="tm-loading" v-else>读取中…</div>
  </section>
</template>

<style scoped>
.tag-manager {
  max-width: 640px;
}

.tm-head {
  margin-bottom: 1.25rem;
}
.tm-title-row {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}
.tm-title-icon {
  width: 1.1rem;
  height: 1.1rem;
  color: var(--accent);
  transform: translateY(0.15rem);
}
.tm-title {
  margin: 0;
  font-family: var(--font-serif);
  font-weight: 600;
  font-size: 1.25rem;
  letter-spacing: 0.02em;
  color: var(--ink);
}
.tm-count {
  font-size: 0.8rem;
  color: var(--ink-soft, #8a857a);
  font-variant-numeric: tabular-nums;
}
.tm-hint {
  margin: 0.35rem 0 0;
  font-size: 0.82rem;
  color: var(--ink-soft, #8a857a);
}

/* 新建行 */
.tm-create {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 1.5rem;
}
.tm-input {
  flex: 1;
  border: 0;
  border-bottom: 1px solid var(--hairline);
  background: transparent;
  padding: 0.5rem 0.1rem;
  font: inherit;
  font-size: 0.95rem;
  color: var(--ink);
  outline: none;
  transition: border-color 0.2s var(--ease, ease);
}
.tm-input::placeholder {
  color: var(--ink-soft, #b4aea2);
  font-family: var(--font-serif);
  font-style: italic;
}
.tm-input:focus {
  border-bottom-color: var(--accent);
}
.tm-add {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid var(--hairline);
  background: var(--paper-soft);
  color: var(--ink);
  padding: 0.5rem 0.9rem;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}
.tm-add svg {
  width: 0.95rem;
  height: 0.95rem;
}
.tm-add:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}
.tm-add:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 列表 */
.tm-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.tm-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.7rem 0.25rem;
  border-bottom: 1px solid var(--hairline);
  animation: row-in 0.4s var(--ease, ease) backwards;
  animation-delay: calc(var(--i) * 0.04s);
  transition: background 0.2s var(--ease, ease);
}
.tm-row:hover {
  background: var(--paper-soft);
}
@keyframes row-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .tm-row { animation: none; }
}

.tm-name-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
}
.tm-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--accent);
  opacity: 0.55;
  flex-shrink: 0;
}
.tm-name {
  font-size: 0.95rem;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tm-edit-input {
  flex: 1;
}

/* 关联数量 */
.tm-counts {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}
.tm-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.78rem;
  color: var(--ink-soft, #8a857a);
  font-variant-numeric: tabular-nums;
}
.tm-chip svg {
  width: 0.85rem;
  height: 0.85rem;
}
.tm-chip-quiet {
  font-style: italic;
  opacity: 0.7;
}

/* 操作 */
.tm-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s var(--ease, ease);
}
.tm-row:hover .tm-actions,
.tm-row.confirming .tm-actions {
  opacity: 1;
}
.tm-row.confirming {
  background: var(--paper-soft);
}
.tm-act {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border: 0;
  background: transparent;
  color: var(--ink-soft, #8a857a);
  font-size: 0.82rem;
  cursor: pointer;
  padding: 0.25rem 0.4rem;
  border-radius: 3px;
  transition: color 0.2s, background 0.2s;
}
.tm-act svg {
  width: 0.95rem;
  height: 0.95rem;
}
.tm-act-quiet:hover {
  color: var(--ink);
  background: rgba(0, 0, 0, 0.04);
}
.tm-act-del:hover {
  color: #b85c3e;
}
.tm-act-danger {
  color: #b85c3e;
}
.tm-act-danger:hover {
  background: rgba(184, 92, 62, 0.08);
}
.tm-confirm-text {
  font-size: 0.78rem;
  color: #b85c3e;
  font-style: italic;
}

/* 空状态 */
.tm-empty {
  text-align: center;
  padding: 3rem 1rem 2.5rem;
  border: 1px dashed var(--hairline);
  border-radius: 6px;
  background: var(--paper-soft);
}
.tm-empty-icon {
  width: 2rem;
  height: 2rem;
  color: var(--accent);
  opacity: 0.5;
  margin-bottom: 0.75rem;
}
.tm-empty-title {
  margin: 0 0 0.3rem;
  font-family: var(--font-serif);
  font-size: 1.05rem;
  color: var(--ink);
}
.tm-empty-sub {
  margin: 0;
  font-size: 0.82rem;
  color: var(--ink-soft, #8a857a);
}

.tm-loading {
  padding: 2rem 0;
  text-align: center;
  font-size: 0.85rem;
  color: var(--ink-soft, #8a857a);
}
</style>
