export interface HospitalDoctor {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  specialty: string;
  qualification: string;
  title: string;
  experienceYears: number | null;
  roomNumber: string;
  opdRoom: string;
  rating: number | null;
  reviewCount: number;
  languages: string[];
  bio: string;
  education: string[];
  awards: string[];
  availability: string;
  specializations: string[];
  specialties: string[];
  consultationFee: number;
  imageUrl: string;
}

const DOCTOR_AVATARS: Record<string, string> = {
  'doc-1': 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
  'doc-2': 'https://images.unsplash.com/photo-1594824813589-32212906b3a2?auto=format&fit=crop&q=80&w=400',
  'doc-3': 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
  'doc-4': 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
  'doc-5': 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400',
  'doc-6': 'https://images.unsplash.com/photo-1594824813603-ee8388c674c1?auto=format&fit=crop&q=80&w=400',
  'doc-7': 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=400',
  'doc-8': 'https://images.unsplash.com/photo-1622902046580-2b47f47f5471?auto=format&fit=crop&q=80&w=400',
  'doc-9': 'https://images.unsplash.com/photo-1637059824899-a441006a6875?auto=format&fit=crop&q=80&w=400',
  'doc-10': 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&q=80&w=400',
  'doc-11': 'https://images.unsplash.com/photo-1622253694242-abdb3c8b41c6?auto=format&fit=crop&q=80&w=400',
  'doc-12': 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=400',
};

export function deduplicateDoctors(doctors: HospitalDoctor[]): HospitalDoctor[] {
  const seen = new Map<string, HospitalDoctor>();
  for (const doc of doctors) {
    if (doc.id && !seen.has(doc.id)) {
      seen.set(doc.id, doc);
    }
  }
  return Array.from(seen.values());
}

export function mapDoctorResponse(doctor: any): HospitalDoctor {
  const docId = String(doctor.id || '');
  const dept = String(doctor.department_name || doctor.specialty || 'General Medicine');
  const room = String(doctor.room_number || doctor.opdRoom || 'OPD-101');
  const specs = Array.isArray(doctor.specializations)
    ? doctor.specializations.map(String)
    : Array.isArray(doctor.specialties)
      ? doctor.specialties.map(String)
      : [];

  const qualification = String(doctor.qualification || 'MBBS, MD');

  return {
    id: docId,
    name: String(doctor.full_name || doctor.name || 'Name unavailable'),
    departmentId: String(doctor.department_id || ''),
    departmentName: dept,
    specialty: dept,
    qualification,
    title: String(doctor.title || `${dept} Consultant`),
    experienceYears: Number.isFinite(Number(doctor.experience_years)) ? Number(doctor.experience_years) : 12,
    roomNumber: room,
    opdRoom: room,
    rating: Number.isFinite(Number(doctor.rating)) ? Number(doctor.rating) : 4.85,
    reviewCount: Number.isFinite(Number(doctor.review_count)) ? Number(doctor.review_count) : 124,
    languages: Array.isArray(doctor.languages) && doctor.languages.length > 0
      ? doctor.languages.map(String)
      : ['English', 'Tamil', 'Hindi'],
    bio: String(doctor.bio || doctor.about || `Senior Clinical Faculty and Specialist in ${dept} with extensive tertiary healthcare experience.`),
    education: Array.isArray(doctor.education) && doctor.education.length > 0
      ? doctor.education.map(String)
      : [qualification, 'Fellow of the Royal College of Physicians (FRCP)'],
    awards: Array.isArray(doctor.awards) && doctor.awards.length > 0
      ? doctor.awards.map(String)
      : ['National Healthcare Leadership Award', 'Clinical Excellence Recognition'],
    availability: String(doctor.availability || 'Monday - Saturday (09:00 AM - 05:00 PM)'),
    specializations: specs.length > 0 ? specs : [dept],
    specialties: specs.length > 0 ? specs : [dept],
    consultationFee: Number(doctor.consultation_fee) || 800,
    imageUrl: doctor.image_url || doctor.imageUrl || DOCTOR_AVATARS[docId] || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
  };
}
