import axios from 'axios'

const api = axios.create({ baseURL: '' })

export async function identifyPlant(file) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post('/identify', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function getCare(identificationId) {
  const { data } = await api.get(`/care/${identificationId}`)
  return data
}

export async function getHistory(page = 1, pageSize = 20) {
  const { data } = await api.get('/history', { params: { page, page_size: pageSize } })
  return data
}

export async function getIdentification(id) {
  const { data } = await api.get(`/history/${id}`)
  return data
}

export async function createJournalEntry(payload) {
  const { data } = await api.post('/journal', payload)
  return data
}

export async function updateJournalEntry(id, payload) {
  const { data } = await api.patch(`/journal/${id}`, payload)
  return data
}

export async function deleteJournalEntry(id) {
  await api.delete(`/journal/${id}`)
}
