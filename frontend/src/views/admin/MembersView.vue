<template>
  <div>
    <h2>Members</h2>

    <!-- Add member -->
    <div class="card">
      <h3>Add Member</h3>
      <form @submit.prevent="addMember" class="row-gap">
        <label>
          Name
          <input v-model="newName" type="text" placeholder="Full name" required style="min-width:220px" />
        </label>
        <button type="submit">Add</button>
      </form>
    </div>

    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th style="text-align:center">Active</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="m in members" :key="m.id">
          <!-- Name cell – inline edit -->
          <td>
            <span v-if="editingId !== m.id">{{ m.name }}</span>
            <input v-else v-model="editName" type="text" style="width:200px" />
          </td>
          <!-- Active toggle -->
          <td style="text-align:center">
            <input type="checkbox" :checked="!!m.active" @change="toggleActive(m)" />
          </td>
          <!-- Actions -->
          <td style="display:flex;gap:0.5rem">
            <template v-if="editingId === m.id">
              <button class="sm" @click="saveMember(m)">Save</button>
              <button class="sm secondary" @click="editingId = null">Cancel</button>
            </template>
            <template v-else>
              <button class="sm" @click="startEdit(m)">Edit</button>
              <button class="sm danger" @click="deleteMember(m)">Delete</button>
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api/index.js'

const members   = ref([])
const newName   = ref('')
const editingId = ref(null)
const editName  = ref('')

async function load() {
  const res = await api.get('/api/members')
  members.value = res.data
}

async function addMember() {
  await api.post('/api/members', { name: newName.value })
  newName.value = ''
  load()
}

function startEdit(m) {
  editingId.value = m.id
  editName.value  = m.name
}

async function saveMember(m) {
  await api.put(`/api/members/${m.id}`, { name: editName.value, active: m.active })
  editingId.value = null
  load()
}

async function toggleActive(m) {
  await api.put(`/api/members/${m.id}`, { name: m.name, active: !m.active })
  load()
}

async function deleteMember(m) {
  if (!confirm(`Delete member "${m.name}"? This also removes their scores.`)) return
  await api.delete(`/api/members/${m.id}`)
  load()
}

onMounted(load)
</script>
