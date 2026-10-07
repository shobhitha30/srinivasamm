import apiClient from '../lib/apiClient';
import { supabase } from '../lib/supabaseClient';

export async function registerVolunteer(formData) {
  const { data } = await apiClient.post('/volunteers/register', {
    location: formData.location,
    skills: formData.skills || [],
    interests: formData.interests || [],
    availability: formData.availability,
  });
  return data.data;
}

export async function getMyVolunteerProfile() {
  const { data } = await apiClient.get('/volunteers/my');
  return data.data;
}

export async function getMyAssignments() {
  const { data } = await apiClient.get('/volunteer-assignments/my');
  return data.data;
}

export async function acceptAssignment(assignmentId) {
  const { data } = await apiClient.put(`/volunteer-assignments/${assignmentId}/accept`);
  return data.data;
}

export async function declineAssignment(assignmentId) {
  const { data } = await apiClient.put(`/volunteer-assignments/${assignmentId}/decline`);
  return data.data;
}

export async function completeAssignment(assignmentId) {
  const { data } = await apiClient.put(`/volunteer-assignments/${assignmentId}/complete`);
  return data.data;
}
