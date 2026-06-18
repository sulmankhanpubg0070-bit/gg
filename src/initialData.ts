import { FamilyMember } from "./types";

export const initialFamilyMembers: FamilyMember[] = [
  // Generation 1 (Grandparents)
  {
    id: "g1-dada",
    name: "Muhammad Ali ",
    gender: "male",
    birthYear: "1932",
    deathYear: "2015",
    birthPlace: "Lahore",
    occupation: "Govt Officer",
    notes: "Khandaan k sarbarah. Boht hi shafqat aur hikmat wale insaan."
  },
  {
    id: "g1-dadi",
    name: "Fatima Bibi",
    gender: "female",
    birthYear: "1938",
    deathYear: "2020",
    birthPlace: "Amritsar",
    occupation: "Homemaker",
    notes: "Hamesha sabko laziz khane aur duayein dene wali.",
    spouseId: "g1-dada"
  },
  
  // Generation 2 (Parents & Aunts/Uncles)
  {
    id: "g2-abba",
    name: "Tariq Ali",
    gender: "male",
    birthYear: "1963",
    birthPlace: "Lahore",
    occupation: "Professor",
    notes: "Taleem aur tarbiyat ko hamesha tarjeeh di.",
    fatherId: "g1-dada",
    motherId: "g1-dadi"
  },
  {
    id: "g2-ammi",
    name: "Ayesha Tariq",
    gender: "female",
    birthYear: "1968",
    birthPlace: "Rawalpindi",
    occupation: "Doctor",
    notes: "Boht hi mehnati aur dukh dard baantne wali.",
    spouseId: "g2-abba"
  },
  {
    id: "g2-chacha",
    name: "Sajid Ali",
    gender: "male",
    birthYear: "1970",
    birthPlace: "Lahore",
    occupation: "Software Engineer",
    notes: "Har waqt tech ki baatein karne wale Chacha.",
    fatherId: "g1-dada",
    motherId: "g1-dadi"
  },
  {
    id: "g2-phupo",
    name: "Zainab Bibi",
    gender: "female",
    birthYear: "1966",
    birthPlace: "Lahore",
    occupation: "Teacher",
    notes: "Humari pyari phupo jo hamesha support karti hain.",
    fatherId: "g1-dada",
    motherId: "g1-dadi"
  },

  // Generation 3 (Self & Siblings)
  {
    id: "g3-self",
    name: "Sulman Khan",
    gender: "male",
    birthYear: "2000",
    birthPlace: "Karachi",
    occupation: "UI Engineer / Developer",
    notes: "Hissah-e-Shajra (Website maker). Har waqt naye software tajarbat mein masroof.",
    fatherId: "g2-abba",
    motherId: "g2-ammi"
  },
  {
    id: "g3-behan",
    name: "Zoya Khan",
    gender: "female",
    birthYear: "2003",
    birthPlace: "Karachi",
    occupation: "Graphic Designer",
    notes: "Creative artist aur behtareen painter.",
    fatherId: "g2-abba",
    motherId: "g2-ammi"
  },
  {
    id: "g3-bhai",
    name: "Farhan Khan",
    gender: "male",
    birthYear: "1997",
    birthPlace: "Karachi",
    occupation: "Chartered Accountant",
    notes: "Boht sanjeeda aur behtareen haseb-o-kitaab rakhne wale.",
    fatherId: "g2-abba",
    motherId: "g2-ammi"
  }
];

// Link mutual spouses properly on start so that links are bidirectionally complete
initialFamilyMembers[0].spouseId = "g1-dadi"; // ali -> fatima
initialFamilyMembers[1].spouseId = "g1-dada"; // fatima -> ali
initialFamilyMembers[2].spouseId = "g2-ammi"; // tariq -> ayesha
initialFamilyMembers[3].spouseId = "g2-abba"; // ayesha -> tariq
