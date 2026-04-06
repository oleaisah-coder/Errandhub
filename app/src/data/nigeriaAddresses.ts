export interface NigeriaAddress {
  id: string;
  description: string;
  street: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
}

export const nigeriaAddresses: NigeriaAddress[] = [
  // LAGOS - Victoria Island
  { id: 'l1', description: 'Adetokunbo Ademola Street, Victoria Island, Lagos', street: 'Adetokunbo Ademola Street', city: 'Victoria Island', state: 'Lagos', lat: 6.4281, lng: 3.4219 },
  { id: 'l2', description: 'Ahmadu Bello Way, Victoria Island, Lagos', street: 'Ahmadu Bello Way', city: 'Victoria Island', state: 'Lagos', lat: 6.4253, lng: 3.4095 },
  { id: 'l3', description: 'Ozumba Mbadiwe Avenue, Victoria Island, Lagos', street: 'Ozumba Mbadiwe Avenue', city: 'Victoria Island', state: 'Lagos', lat: 6.4367, lng: 3.4116 },
  
  // LAGOS - Lekki
  { id: 'l4', description: 'Admiralty Way, Lekki Phase 1, Lagos', street: 'Admiralty Way', city: 'Lekki Phase 1', state: 'Lagos', lat: 6.4485, lng: 3.4736 },
  { id: 'l5', description: 'Lekki-Epe Expressway, Lekki, Lagos', street: 'Lekki-Epe Expressway', city: 'Lekki', state: 'Lagos', lat: 6.4589, lng: 3.6015 },
  { id: 'l6', description: 'Freedom Way, Lekki Phase 1, Lagos', street: 'Freedom Way', city: 'Lekki Phase 1', state: 'Lagos', lat: 6.4442, lng: 3.4847 },
  
  // LAGOS - Ikeja
  { id: 'l7', description: 'Allen Avenue, Ikeja, Lagos', street: 'Allen Avenue', city: 'Ikeja', state: 'Lagos', lat: 6.6018, lng: 3.3515 },
  { id: 'l8', description: 'Obafemi Awolowo Way, Ikeja, Lagos', street: 'Obafemi Awolowo Way', city: 'Ikeja', state: 'Lagos', lat: 6.5961, lng: 3.3444 },
  { id: 'l9', description: 'Isaac John Street, GRA Ikeja, Lagos', street: 'Isaac John Street', city: 'Ikeja GRA', state: 'Lagos', lat: 6.5864, lng: 3.3642 },
  { id: 'l10', description: 'Mobolaji Bank Anthony Way, Ikeja, Lagos', street: 'Mobolaji Bank Anthony Way', city: 'Ikeja', state: 'Lagos', lat: 6.5815, lng: 3.3582 },
  { id: 'u1', description: '14 Sabo Bakin Zuwo Road, Ikeja, Lagos', street: '14 Sabo Bakin Zuwo Road', city: 'Ikeja', state: 'Lagos', lat: 6.5912, lng: 3.3411 },

  // ABUJA - Central Business District
  { id: 'a1', description: 'Herbert Macaulay Way, Central Business District, Abuja', street: 'Herbert Macaulay Way', city: 'Abuja CBD', state: 'FCT', lat: 9.0667, lng: 7.4833 },
  { id: 'a2', description: 'Constitution Avenue, Central Business District, Abuja', street: 'Constitution Avenue', city: 'Abuja CBD', state: 'FCT', lat: 9.0558, lng: 7.4891 },
  { id: 'a3', description: 'Independence Avenue, Central Business District, Abuja', street: 'Independence Avenue', city: 'Abuja CBD', state: 'FCT', lat: 9.0611, lng: 7.4914 },

  // ABUJA - Wuse
  { id: 'a4', description: 'Adetokunbo Ademola Crescent, Wuse 2, Abuja', street: 'Adetokunbo Ademola Crescent', city: 'Wuse 2', state: 'FCT', lat: 9.0778, lng: 7.4769 },
  { id: 'a5', description: 'Aminu Kano Crescent, Wuse 2, Abuja', street: 'Aminu Kano Crescent', city: 'Wuse 2', state: 'FCT', lat: 9.0833, lng: 7.4722 },
  
  // ABUJA - Maitama
  { id: 'a6', description: 'Aguiyi Ironsi Street, Maitama, Abuja', street: 'Aguiyi Ironsi Street', city: 'Maitama', state: 'FCT', lat: 9.0891, lng: 7.4883 },
  { id: 'a7', description: 'Maitama District, Abuja', street: 'Maitama District', city: 'Maitama', state: 'FCT', lat: 9.0967, lng: 7.5022 },
  
  // ABUJA - Garki
  { id: 'a8', description: 'Garki District, Abuja', street: 'Garki District', city: 'Garki', state: 'FCT', lat: 9.0272, lng: 7.4853 },
  { id: 'a9', description: 'Nnamdi Azikiwe Expressway, Garki, Abuja', street: 'Nnamdi Azikiwe Expressway', city: 'Garki', state: 'FCT', lat: 9.0156, lng: 7.5123 },

  // PORT HARCOURT (Bonus)
  { id: 'p1', description: 'Aba Road, Port Harcourt, Rivers State', street: 'Aba Road', city: 'Port Harcourt', state: 'Rivers', lat: 4.8156, lng: 7.0498 },
  { id: 'p2', description: 'Old GRA, Port Harcourt, Rivers State', street: 'Old GRA', city: 'Port Harcourt', state: 'Rivers', lat: 4.7770, lng: 7.0134 },
];
