interface VolunteerRequest {
  required_skills?: string[];
  required_interests?: string[];
  location?: string;
  required_date?: string;
}

interface Volunteer {
  id: string;
  status: string;
  skills?: string[];
  interests?: string[];
  location?: string;
  availability?: string;
  [key: string]: any;
}

export interface MatchResult extends Volunteer {
  match_score: number;
  match_details: {
    skill_matches: string[];
    interest_matches: string[];
    location_match: boolean;
    availability_match: boolean;
  };
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getRequiredDayName(dateStr?: string): string | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    return DAY_NAMES[date.getDay()];
  } catch {
    return null;
  }
}

function checkAvailability(volunteerAvailability?: string, requiredDay?: string | null): boolean {
  if (!volunteerAvailability || !requiredDay) return false;
  const avail = volunteerAvailability.toLowerCase();
  const day = requiredDay.toLowerCase();

  if (avail.includes(day)) return true;
  if (avail.includes('weekday') && ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(day)) return true;
  if (avail.includes('weekend') && ['saturday', 'sunday'].includes(day)) return true;
  if (avail.includes('anytime') || avail.includes('flexible') || avail.includes('any')) return true;

  return false;
}

export function matchVolunteers(request: VolunteerRequest, volunteers: Volunteer[]): MatchResult[] {
  const requiredDay = getRequiredDayName(request.required_date);

  const results: MatchResult[] = volunteers
    .filter((v) => v.status === 'available')
    .map((v) => {
      let score = 0;
      const details = {
        skill_matches: [] as string[],
        interest_matches: [] as string[],
        location_match: false,
        availability_match: false,
      };

      if (request.required_skills && v.skills) {
        const reqSkills = request.required_skills.map((s) => s.toLowerCase());
        const volSkills = v.skills.map((s) => s.toLowerCase());
        const matches = reqSkills.filter((s) => volSkills.includes(s));
        details.skill_matches = matches;
        score += matches.length * 20;
      }

      if (request.required_interests && v.interests) {
        const reqInterests = request.required_interests.map((i) => i.toLowerCase());
        const volInterests = v.interests.map((i) => i.toLowerCase());
        const matches = reqInterests.filter((i) => volInterests.includes(i));
        details.interest_matches = matches;
        score += matches.length * 10;
      }

      if (v.location && request.location && v.location.toLowerCase().trim() === request.location.toLowerCase().trim()) {
        details.location_match = true;
        score += 30;
      }

      if (checkAvailability(v.availability, requiredDay)) {
        details.availability_match = true;
        score += 20;
      }

      return { ...v, match_score: score, match_details: details };
    })
    .filter((m) => m.match_score > 0)
    .sort((a, b) => b.match_score - a.match_score);

  return results;
}
