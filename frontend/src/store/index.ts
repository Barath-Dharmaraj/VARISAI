import { create } from 'zustand';
import i18n from '../i18n';

export interface Office {
  id: string;
  name: string;
  category: string;
  address: string;
  district: string;
  state: string;
  openingTime: string;
  closingTime: string;
  serviceCount: number;
  openCountersCount: number;
  totalCountersCount: number;
  currentWaitingQueue: number;
}

export interface Service {
  id: string;
  officeId: string;
  officeName: string;
  officeCategory: string;
  name: string;
  description: string;
  avgServiceMinutes: number;
  prefix: string;
  currentWaitingCount: number;
}

export type PriorityCategory = 'none' | 'senior_citizen' | 'pregnant_woman' | 'differently_abled';

export interface WaitEstimate {
  currentServingToken: string;
  tokensAhead: number;
  avgServiceTimeMinutes: number;
  activeCountersCount: number;
  predictedWaitMinutes: number;
  confidenceIntervalLow: number;
  confidenceIntervalHigh: number;
  modelName: string;
  benchmarkMae: number;
  benchmarkRmse: number;
  adaptiveWeightBonus: number;
}

export interface ConfirmedBooking {
  id: string;
  bookingRef: string;
  tokenNumber: string;
  email: string;
  citizenName?: string;
  officeId: string;
  officeName: string;
  officeCategory: string;
  officeAddress: string;
  officeDistrict?: string;
  officeState?: string;
  serviceId: string;
  serviceName: string;
  avgServiceMinutes: number;
  priorityCategory: PriorityCategory;
  status: string;
  tokensAhead: number;
  predictedWaitMinutes: number;
  arriveMinutesBefore: number;
  confidenceInterval: [number, number];
  modelName: string;
  benchmarkMae: number;
  createdAt: string;
}

export interface CitizenUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  district?: string;
  priorityCategory?: PriorityCategory;
  pastBookings?: any[];
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
  staffId?: string;
  department?: string;
  officeId?: string;
  officeName?: string;
}

interface AppState {
  language: string;
  loginType: 'CITIZEN' | 'STAFF' | null;
  email: string;
  userName: string;
  isOtpVerified: boolean;
  isStaffVerified: boolean;
  demoOtp: string;
  emailDelivered: boolean;
  isRealInbox: boolean;
  previewUrl: string | null;
  citizenUser: CitizenUser | null;
  staffUser: StaffUser | null;
  selectedOffice: Office | null;
  selectedService: Service | null;
  selectedPriority: PriorityCategory;
  estimate: WaitEstimate | null;
  confirmedBooking: ConfirmedBooking | null;
  
  setLanguage: (lang: string) => void;
  setLoginType: (type: 'CITIZEN' | 'STAFF') => void;
  setEmail: (email: string) => void;
  setUserName: (name: string) => void;
  setDemoOtp: (otp: string) => void;
  setEmailDelivered: (delivered: boolean) => void;
  setIsRealInbox: (real: boolean) => void;
  setPreviewUrl: (url: string | null) => void;
  setOtpVerified: (verified: boolean) => void;
  setStaffVerified: (verified: boolean) => void;
  setCitizenUser: (user: CitizenUser | null) => void;
  setStaffUser: (staff: StaffUser | null) => void;
  setSelectedOffice: (office: Office | null) => void;
  setSelectedService: (service: Service | null) => void;
  setSelectedPriority: (priority: PriorityCategory) => void;
  setEstimate: (estimate: WaitEstimate | null) => void;
  setConfirmedBooking: (booking: ConfirmedBooking | null) => void;
  logoutCitizen: () => void;
  logoutStaff: () => void;
  resetFlow: () => void;
}

const savedStaff = localStorage.getItem('varisai_staff_user');
const savedCitizen = localStorage.getItem('varisai_citizen_user');

export const useAppStore = create<AppState>((set) => ({
  language: localStorage.getItem('varisai_language') || 'en',
  loginType: null,
  email: localStorage.getItem('varisai_citizen_email') || '',
  userName: localStorage.getItem('varisai_citizen_name') || '',
  isOtpVerified: sessionStorage.getItem('varisai_citizen_verified') === 'true',
  isStaffVerified: sessionStorage.getItem('varisai_staff_verified') === 'true',
  demoOtp: '',
  emailDelivered: false,
  isRealInbox: false,
  previewUrl: null,
  citizenUser: savedCitizen ? JSON.parse(savedCitizen) : null,
  staffUser: savedStaff ? JSON.parse(savedStaff) : null,
  selectedOffice: null,
  selectedService: null,
  selectedPriority: 'none',
  estimate: null,
  confirmedBooking: null,

  setLanguage: (lang: string) => {
    localStorage.setItem('varisai_language', lang);
    i18n.changeLanguage(lang);
    set({ language: lang });
  },
  setLoginType: (type) => set({ loginType: type }),
  setEmail: (email: string) => {
    localStorage.setItem('varisai_citizen_email', email);
    set({ email });
  },
  setUserName: (userName: string) => {
    localStorage.setItem('varisai_citizen_name', userName);
    set({ userName });
  },
  setDemoOtp: (demoOtp) => set({ demoOtp }),
  setEmailDelivered: (emailDelivered) => set({ emailDelivered }),
  setIsRealInbox: (isRealInbox) => set({ isRealInbox }),
  setPreviewUrl: (previewUrl) => set({ previewUrl }),
  setOtpVerified: (isOtpVerified) => {
    if (isOtpVerified) {
      sessionStorage.setItem('varisai_citizen_verified', 'true');
    } else {
      sessionStorage.removeItem('varisai_citizen_verified');
    }
    set({ isOtpVerified });
  },
  setStaffVerified: (isStaffVerified) => {
    if (isStaffVerified) {
      sessionStorage.setItem('varisai_staff_verified', 'true');
    } else {
      sessionStorage.removeItem('varisai_staff_verified');
    }
    set({ isStaffVerified });
  },
  setCitizenUser: (citizenUser) => {
    if (citizenUser) {
      sessionStorage.setItem('varisai_citizen_verified', 'true');
      localStorage.setItem('varisai_citizen_user', JSON.stringify(citizenUser));
      localStorage.setItem('varisai_citizen_email', citizenUser.email);
      localStorage.setItem('varisai_citizen_name', citizenUser.name);
      set({
        citizenUser,
        isOtpVerified: true,
        email: citizenUser.email,
        userName: citizenUser.name,
        selectedPriority: citizenUser.priorityCategory || 'none'
      });
    } else {
      sessionStorage.removeItem('varisai_citizen_verified');
      localStorage.removeItem('varisai_citizen_user');
      set({ citizenUser: null, isOtpVerified: false });
    }
  },
  logoutCitizen: () => {
    sessionStorage.removeItem('varisai_citizen_verified');
    localStorage.removeItem('varisai_citizen_user');
    localStorage.removeItem('varisai_citizen_email');
    localStorage.removeItem('varisai_citizen_name');
    set({ citizenUser: null, email: '', userName: '', isOtpVerified: false });
  },
  setStaffUser: (staffUser) => {
    if (staffUser) {
      sessionStorage.setItem('varisai_staff_verified', 'true');
      localStorage.setItem('varisai_staff_user', JSON.stringify(staffUser));
      set({ staffUser, isStaffVerified: true });
    } else {
      sessionStorage.removeItem('varisai_staff_verified');
      localStorage.removeItem('varisai_staff_user');
      set({ staffUser: null, isStaffVerified: false });
    }
  },
  setSelectedOffice: (selectedOffice) => set({ selectedOffice }),
  setSelectedService: (selectedService) => set({ selectedService }),
  setSelectedPriority: (selectedPriority) => set({ selectedPriority }),
  setEstimate: (estimate) => set({ estimate }),
  setConfirmedBooking: (confirmedBooking) => set({ confirmedBooking }),
  logoutStaff: () => {
    sessionStorage.removeItem('varisai_staff_verified');
    localStorage.removeItem('varisai_staff_user');
    set({ staffUser: null, isStaffVerified: false });
  },
  resetFlow: () => set({
    selectedOffice: null,
    selectedService: null,
    selectedPriority: 'none',
    estimate: null,
    confirmedBooking: null
  })
}));
