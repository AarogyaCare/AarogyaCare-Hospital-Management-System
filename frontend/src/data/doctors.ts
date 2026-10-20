export interface Doctor {
  id: string;
  name: string;
  title: string;
  specialty: string;
  specialties: string[];
  departmentId: string;
  rating: number;
  reviewCount: number;
  qualification: string;
  experienceYears: number;
  languages: string[];
  consultationFee: number;
  opdRoom: string;
  imageUrl: string;
  availability: string;
  availableDays: string[];
  timeSlots: string[];
  bio: string;
  education: string[];
  awards: string[];
}

export const doctors: Doctor[] = [
  {
    id: 'doc-1',
    name: 'Dr. V. Ramanathan',
    title: 'Senior Interventional Cardiologist & Director',
    specialty: 'Cardiology & Cardiac Surgery',
    specialties: ['Cardiology & Cardiac Surgery', 'Cardiology', 'Emergency & Critical Care Medicine'],
    departmentId: 'cardiology',
    rating: 4.9,
    reviewCount: 342,
    qualification: 'MD, DM (Cardiology), FACC, FSCAI',
    experienceYears: 22,
    languages: ['English', 'Tamil', 'Hindi'],
    consultationFee: 1200,
    opdRoom: 'OPD Suite 204, Tower A',
    imageUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    availability: 'Mon - Sat (09:00 AM - 01:00 PM)',
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    timeSlots: ['09:00 AM', '09:30 AM', '10:00 AM', '11:15 AM', '12:00 PM', '12:30 PM'],
    bio: 'Dr. V. Ramanathan has performed over 8,500 complex coronary angioplasties, bifurcation stenting, and transcatheter aortic valve replacements (TAVR). Leading the Grems Road campus cardiac response team.',
    education: ['DM Cardiology - Madras Medical College, Chennai', 'MD General Medicine - Stanley Medical College', 'Fellowship in Interventional Cardiology - Cleveland Clinic, USA'],
    awards: ['Tamil Nadu State Best Doctor Award (2022)', 'Life Member, Cardiological Society of India', 'Outstanding Clinical Excellence Medal (2020)']
  },
  {
    id: 'doc-2',
    name: 'Dr. Meenakshi Sundaram',
    title: 'Chief Neurosurgeon & Neuro-Interventionist',
    specialty: 'Neurology & Neurosurgery',
    specialties: ['Neurology & Neurosurgery', 'Neurology'],
    departmentId: 'neurology',
    rating: 4.85,
    reviewCount: 289,
    qualification: 'MBBS, MS (Gen Surg), MCh (Neurosurgery), FINR (Zurich)',
    experienceYears: 18,
    languages: ['English', 'Tamil', 'Telugu'],
    consultationFee: 1400,
    opdRoom: 'OPD Suite 310, Neuro Wing',
    imageUrl: 'https://images.unsplash.com/photo-1594824813576-59b152d11e5a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    availability: 'Mon - Fri (10:00 AM - 03:00 PM)',
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    timeSlots: ['10:00 AM', '10:45 AM', '11:30 AM', '01:30 PM', '02:15 PM'],
    bio: 'Pioneer in intraoperative MRI-guided brain tumor resections, acute ischemic stroke mechanical thrombectomy, and complex skull-base microscopic surgeries.',
    education: ['MCh Neurosurgery - Christian Medical College (CMC), Vellore', 'Fellowship in Endovascular Neuro-Intervention - University Hospital Zurich'],
    awards: ['Neurological Society of India Young Neurosurgeon Gold Medal', 'Chennai Healthcare Innovator of the Year']
  },
  {
    id: 'doc-3',
    name: 'Dr. K. S. Balaraman',
    title: 'Senior Consultant Orthopedic Surgeon & Robotic Joint Specialist',
    specialty: 'Orthopedics & Joint Replacement',
    specialties: ['Orthopedics & Joint Replacement', 'Orthopedics'],
    departmentId: 'orthopedics',
    rating: 4.8,
    reviewCount: 410,
    qualification: 'MS (Ortho), MCh Ortho (Dundee, UK), FRCS',
    experienceYears: 24,
    languages: ['English', 'Tamil'],
    consultationFee: 1100,
    opdRoom: 'OPD Suite 102, Ortho Center',
    imageUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    availability: 'Mon, Wed, Fri (08:30 AM - 02:00 PM)',
    availableDays: ['Monday', 'Wednesday', 'Friday'],
    timeSlots: ['08:30 AM', '09:15 AM', '10:00 AM', '11:00 AM', '01:00 PM'],
    bio: 'Renowned for robotic computer-navigated total knee arthroplasty, revision hip surgeries, and multi-ligament knee reconstruction in competitive athletes.',
    education: ['MCh Orthopedics - University of Dundee, Scotland', 'MS Ortho - Kilpauk Medical College, Chennai'],
    awards: ['Pioneer in Mako Robotic Arthroplasty in South India', 'Distinguished Orthopedic Leader Award 2021']
  },
  {
    id: 'doc-4',
    name: 'Dr. Preetha Balakrishnan',
    title: 'Lead Medical Oncologist & Precision Therapeutics',
    specialty: 'Medical & Surgical Oncology',
    specialties: ['Medical & Surgical Oncology', 'Oncology'],
    departmentId: 'oncology',
    rating: 4.92,
    reviewCount: 198,
    qualification: 'MD (Int Med), DM (Medical Oncology), ESMO Certified',
    experienceYears: 16,
    languages: ['English', 'Tamil', 'Malayalam', 'Hindi'],
    consultationFee: 1500,
    opdRoom: 'Cancer Pavilion, 4th Floor',
    imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    availability: 'Tue, Thu, Sat (10:00 AM - 04:00 PM)',
    availableDays: ['Tuesday', 'Thursday', 'Saturday'],
    timeSlots: ['10:00 AM', '11:00 AM', '12:30 PM', '02:00 PM', '03:15 PM'],
    bio: 'Specialist in targeted immunotherapy, next-generation genomic sequencing for solid tumors, and adjuvant protocols for breast and gastrointestinal cancers.',
    education: ['DM Medical Oncology - Cancer Institute (WIA), Adyar, Chennai', 'ESMO Board Certified in Medical Oncology - Geneva, Switzerland'],
    awards: ['ESMO Clinical Research Fellowship Award', 'Women in Medicine Leadership Honour 2023']
  },
  {
    id: 'doc-5',
    name: 'Dr. S. Jayakumar',
    title: 'Senior Consultant Nephrologist & Transplant Physician',
    specialty: 'Nephrology & Renal Transplant',
    specialties: ['Nephrology & Renal Transplant', 'Nephrology'],
    departmentId: 'nephrology',
    rating: 4.78,
    reviewCount: 220,
    qualification: 'MD (Gen Med), DM (Nephrology), FRCP (London)',
    experienceYears: 20,
    languages: ['English', 'Tamil'],
    consultationFee: 1200,
    opdRoom: 'OPD Suite 215, Renal Wing',
    imageUrl: 'https://images.unsplash.com/photo-1622902046580-2b47f47f5471?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    availability: 'Mon - Fri (09:00 AM - 01:30 PM)',
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    timeSlots: ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM'],
    bio: 'Supervising high-risk ABO-incompatible kidney transplants, continuous renal replacement therapy in intensive care, and lupus nephritis remission protocols.',
    education: ['DM Nephrology - Madras Medical College', 'FRCP - Royal College of Physicians, London'],
    awards: ['Indian Society of Nephrology Outstanding Service Citation']
  },
  {
    id: 'doc-6',
    name: 'Dr. Shalini Venugopal',
    title: 'Head of Pediatrics & Neonatal Intensive Care',
    specialty: 'Pediatrics & Neonatal Intensive Care',
    specialties: ['Pediatrics & Neonatal Intensive Care', 'Pediatrics'],
    departmentId: 'pediatrics',
    rating: 4.88,
    reviewCount: 360,
    qualification: 'MD (Pediatrics), DNB (Pediatrics), Fellowship in Neonatology (Sydney)',
    experienceYears: 15,
    languages: ['English', 'Tamil', 'Kannada'],
    consultationFee: 1000,
    opdRoom: 'Child Care Clinic, Block B 1st Floor',
    imageUrl: 'https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    availability: 'Mon - Sat (09:00 AM - 02:00 PM)',
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    timeSlots: ['09:00 AM', '09:45 AM', '10:30 AM', '11:15 AM', '12:30 PM'],
    bio: 'Dedicated to developmental pediatrics, extreme preterm infant rescue, pediatric allergy clinics, and comprehensive vaccination counseling.',
    education: ['Fellowship in Neonatology - Westmead Hospital, Sydney, Australia', 'MD Pediatrics - Institute of Child Health, Egmore, Chennai'],
    awards: ['National Neonatology Forum Best Paper Award', 'Compassionate Pediatrician Award']
  }
];

export const getDoctorById = (id: string): Doctor | undefined => {
  return doctors.find((doc) => doc.id === id);
};
