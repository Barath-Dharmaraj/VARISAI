import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting VARISAI Database Seed with Email Authentication & Staff Authorization...");

  // Clean existing tables
  await prisma.booking.deleteMany();
  await prisma.counter.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();
  await prisma.office.deleteMany();
  await prisma.otpVerification.deleteMany();

  // 1. Seed Offices
  const officesData = [
    {
      name: "State Bank of India — Collectorate Complex Branch",
      category: "Government Bank",
      address: "Ground Floor, District Collectorate Campus, Rajaji Salai",
      district: "Chennai",
      state: "Tamil Nadu",
      openingTime: "09:30 AM",
      closingTime: "04:30 PM",
      services: [
        {
          name: "Senior Citizen Pension Disbursement & Life Certificate",
          description: "Priority counter for EPS-95, state welfare pensions, and Jeevan Pramaan digital life verification.",
          avgServiceMinutes: 10.0,
          prefix: "P"
        },
        {
          name: "Disability Allowance Account & Subsidy KYC",
          description: "Assisted account opening, DBDA welfare transfers, and biometric validation assistance.",
          avgServiceMinutes: 14.0,
          prefix: "D"
        },
        {
          name: "General Banking & Cash Remittance",
          description: "Standard counter for government challan payments, drafts, and treasury deposits.",
          avgServiceMinutes: 12.0,
          prefix: "B"
        }
      ],
      counters: [
        { counterNumber: 1, staffName: "Ananya Sundaram (Desk Lead)", isOpen: true },
        { counterNumber: 2, staffName: "K. Muralikrishnan (Officer)", isOpen: true },
        { counterNumber: 3, staffName: "R. Priyadarshini (Assistant)", isOpen: true },
        { counterNumber: 4, staffName: "S. Balasubramanian (Relief)", isOpen: false }
      ]
    },
    {
      name: "Taluk Office — Tambaram Revenue Division",
      category: "Taluk Office",
      address: "GST Road, Near Tambaram Sanatorium, Tambaram",
      district: "Chengalpattu",
      state: "Tamil Nadu",
      openingTime: "09:00 AM",
      closingTime: "05:30 PM",
      services: [
        {
          name: "Community, Nativity & Income Certificate In-Person Verification",
          description: "Verification of original documents for online e-Sevai applications.",
          avgServiceMinutes: 15.0,
          prefix: "C"
        },
        {
          name: "Patta Transfer & Land Record Rectification Appeal",
          description: "Tahsildar public hearing queue for land sub-division and registry disputes.",
          avgServiceMinutes: 22.0,
          prefix: "T"
        },
        {
          name: "Legal Heir & Solvency Certificate Scrutiny",
          description: "Document examination with revenue inspector sign-off for family inheritance.",
          avgServiceMinutes: 18.0,
          prefix: "L"
        }
      ],
      counters: [
        { counterNumber: 1, staffName: "V. Selvam (HQ Tahsildar)", isOpen: true },
        { counterNumber: 2, staffName: "M. Gayathri (Deputy Tahsildar)", isOpen: true },
        { counterNumber: 3, staffName: "T. Rajendran (Revenue Inspector)", isOpen: true },
        { counterNumber: 4, staffName: "D. Meenakshi (Record Clerk)", isOpen: false }
      ]
    },
    {
      name: "Village Administrative Office — Velachery West Circle",
      category: "VAO Office",
      address: "14/2 Gandhi Road, Behind Ward Office, Velachery",
      district: "Chennai",
      state: "Tamil Nadu",
      openingTime: "10:00 AM",
      closingTime: "05:00 PM",
      services: [
        {
          name: "Old Age Pension & Destitute Allowance Verification",
          description: "In-person field inquiry sign-off for elderly applicants aged 60+.",
          avgServiceMinutes: 10.0,
          prefix: "V"
        },
        {
          name: "Adangal Copy & Chitta Extract Verification",
          description: "Crop inspection extracts and local field boundary endorsement.",
          avgServiceMinutes: 16.0,
          prefix: "A"
        },
        {
          name: "Residence & Unmarried/Widow Certificate Endorsement",
          description: "Local area recommendation required for higher government welfare schemes.",
          avgServiceMinutes: 12.0,
          prefix: "R"
        }
      ],
      counters: [
        { counterNumber: 1, staffName: "E. Manoharan (VAO Velachery)", isOpen: true },
        { counterNumber: 2, staffName: "P. Kavitha (Village Assistant)", isOpen: true },
        { counterNumber: 3, staffName: "G. Sankar (Field Assistant)", isOpen: false }
      ]
    },
    {
      name: "Tambaram City Municipal Corporation — Zone 3 Head Office",
      category: "Municipal Office",
      address: "Muthuranga Mudali Street, West Tambaram",
      district: "Chengalpattu",
      state: "Tamil Nadu",
      openingTime: "09:00 AM",
      closingTime: "05:00 PM",
      services: [
        {
          name: "Differently-Abled Concession Pass & Aid Scheme Enrollment",
          description: "Priority desk for free bus transit pass endorsement and welfare devices.",
          avgServiceMinutes: 12.0,
          prefix: "W"
        },
        {
          name: "Property Tax Assessment, Mutation & Name Transfer",
          description: "Assessment review and title transfer verification for municipal records.",
          avgServiceMinutes: 20.0,
          prefix: "M"
        },
        {
          name: "Birth, Death & Marriage Registration Endorsement",
          description: "Official municipal registrar seal and corrections on vital records.",
          avgServiceMinutes: 14.0,
          prefix: "B"
        }
      ],
      counters: [
        { counterNumber: 1, staffName: "S. Nithya (Assistant Commissioner)", isOpen: true },
        { counterNumber: 2, staffName: "K. Venkatesan (Tax Superintendent)", isOpen: true },
        { counterNumber: 3, staffName: "R. Jayashree (Health Inspector Desk)", isOpen: true },
        { counterNumber: 4, staffName: "N. Karthik (Registration Clerk)", isOpen: false }
      ]
    }
  ];

  for (const oData of officesData) {
    const { services, counters, ...officeFields } = oData;
    const createdOffice = await prisma.office.create({
      data: officeFields
    });

    for (const s of services) {
      await prisma.service.create({
        data: {
          ...s,
          officeId: createdOffice.id
        }
      });
    }

    for (const c of counters) {
      await prisma.counter.create({
        data: {
          ...c,
          officeId: createdOffice.id
        }
      });
    }
  }

  const mainOffice = await prisma.office.findFirst({
    where: { category: "Government Bank" },
    include: { services: true, counters: true }
  });

  const talukOffice = await prisma.office.findFirst({
    where: { category: "Taluk Office" },
    include: { services: true }
  });

  // 2. Seed Authorized Staff Accounts in User Table
  console.log("Seeding Registered Staff Users...");
  await prisma.user.createMany({
    data: [
      {
        email: "officer@tn.gov.in",
        name: "V. Selvam (HQ Tahsildar)",
        role: "STAFF",
        staffId: "TN-OFFICER-001",
        department: "Revenue Administration",
        officeId: talukOffice?.id
      },
      {
        email: "staff@sbi.co.in",
        name: "Ananya Sundaram (Desk Lead)",
        role: "STAFF",
        staffId: "SBI-DESK-101",
        department: "Pension & Public Accounts",
        officeId: mainOffice?.id
      },
      {
        email: "vao.velachery@tn.gov.in",
        name: "E. Manoharan (VAO)",
        role: "STAFF",
        staffId: "TN-VAO-042",
        department: "Village Administration Desk"
      },
      {
        email: "admin@varisai.gov.in",
        name: "State Queue Administrator",
        role: "STAFF",
        staffId: "VAR-ADMIN-999",
        department: "Public Grievance Redressal"
      },
      {
        email: "citizen.kumar@gmail.com",
        name: "Kumaravel S.",
        role: "CITIZEN"
      },
      {
        email: "anand.senior@gmail.com",
        name: "Anandakrishnan M.",
        role: "CITIZEN"
      }
    ]
  });

  // 3. Seed Active & Historical Bookings
  if (mainOffice && mainOffice.services.length > 0) {
    const s1 = mainOffice.services[0]; // Senior Citizen Pension
    const s2 = mainOffice.services[1]; // Disability Allowance

    // Create 1 SERVING token
    await prisma.booking.create({
      data: {
        bookingRef: "VAR-2026-0841",
        tokenNumber: `${s1.prefix}-101`,
        email: "anand.senior@gmail.com",
        citizenName: "Anandakrishnan M.",
        officeId: mainOffice.id,
        serviceId: s1.id,
        priorityCategory: "senior_citizen",
        status: "SERVING",
        fifoPosition: 1,
        priorityScore: 28.5,
        predictedWaitMinutes: 0.0,
        counterNumber: 1,
        calledAt: new Date(Date.now() - 6 * 60 * 1000)
      }
    });

    // Update Counter 1 to show serving token
    await prisma.counter.updateMany({
      where: { officeId: mainOffice.id, counterNumber: 1 },
      data: { currentToken: `${s1.prefix}-101` }
    });

    // Create 4 WAITING tokens with adaptive priority nuances
    const waitingTokens = [
      {
        bookingRef: "VAR-2026-0842",
        tokenNumber: `${s1.prefix}-102`,
        email: "meena.pwd@gmail.com",
        citizenName: "Meenakshi R.",
        priorityCategory: "differently_abled",
        status: "WAITING",
        fifoPosition: 2,
        priorityScore: 25.2,
        predictedWaitMinutes: 8.0,
        offsetMins: 15
      },
      {
        bookingRef: "VAR-2026-0843",
        tokenNumber: `${s1.prefix}-103`,
        email: "lakshmi.mat@gmail.com",
        citizenName: "Lakshmi Narayanan",
        priorityCategory: "pregnant_woman",
        status: "WAITING",
        fifoPosition: 3,
        priorityScore: 22.0,
        predictedWaitMinutes: 14.5,
        offsetMins: 12
      },
      {
        bookingRef: "VAR-2026-0844",
        tokenNumber: `${s1.prefix}-104`,
        email: "citizen.kumar@gmail.com",
        citizenName: "Kumaravel S.",
        priorityCategory: "none",
        status: "WAITING",
        fifoPosition: 4,
        priorityScore: 18.0,
        predictedWaitMinutes: 24.0,
        offsetMins: 20
      },
      {
        bookingRef: "VAR-2026-0845",
        tokenNumber: `${s1.prefix}-105`,
        email: "subbu.elder@gmail.com",
        citizenName: "Subramanian V.",
        priorityCategory: "senior_citizen",
        status: "WAITING",
        fifoPosition: 5,
        priorityScore: 19.5,
        predictedWaitMinutes: 30.0,
        offsetMins: 5
      }
    ];

    for (const wt of waitingTokens) {
      await prisma.booking.create({
        data: {
          bookingRef: wt.bookingRef,
          tokenNumber: wt.tokenNumber,
          email: wt.email,
          citizenName: wt.citizenName,
          officeId: mainOffice.id,
          serviceId: s1.id,
          priorityCategory: wt.priorityCategory,
          status: wt.status,
          fifoPosition: wt.fifoPosition,
          priorityScore: wt.priorityScore,
          predictedWaitMinutes: wt.predictedWaitMinutes,
          createdAt: new Date(Date.now() - wt.offsetMins * 60 * 1000)
        }
      });
    }

    // Historical bookings for analytics charts (last 7 days)
    const priorities = ["none", "senior_citizen", "pregnant_woman", "differently_abled"];
    const statuses = ["COMPLETED", "COMPLETED", "COMPLETED", "COMPLETED", "SKIPPED"];

    for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
      const recordsPerDay = 15 + Math.floor(Math.random() * 10);
      for (let i = 0; i < recordsPerDay; i++) {
        const cat = priorities[Math.floor(Math.random() * priorities.length)];
        const stat = statuses[Math.floor(Math.random() * statuses.length)];
        const waitMins = cat === "differently_abled" ? 10 + Math.random() * 8 :
                         cat === "pregnant_woman" ? 12 + Math.random() * 10 :
                         cat === "senior_citizen" ? 14 + Math.random() * 12 :
                         22 + Math.random() * 18;

        const date = new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000 + i * 25 * 60 * 1000);
        await prisma.booking.create({
          data: {
            bookingRef: `VAR-HIST-${dayOffset}-${i + 100}`,
            tokenNumber: `${s1.prefix}-${200 + i}`,
            email: `user.${dayOffset}.${i}@gmail.com`,
            citizenName: `Citizen ${i + 1}`,
            officeId: mainOffice.id,
            serviceId: s1.id,
            priorityCategory: cat,
            status: stat,
            fifoPosition: i + 1,
            priorityScore: 15.0 + Math.random() * 10,
            predictedWaitMinutes: Math.round(waitMins * 10) / 10,
            counterNumber: 1 + (i % 3),
            calledAt: new Date(date.getTime() + waitMins * 60 * 1000),
            completedAt: new Date(date.getTime() + (waitMins + 12) * 60 * 1000),
            createdAt: date
          }
        });
      }
    }
  }

  // Pre-seed demo staff OTP
  await prisma.otpVerification.create({
    data: {
      email: "officer@tn.gov.in",
      otp: "5678",
      userType: "STAFF",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isVerified: false
    }
  });

  console.log("Database seeded successfully with registered staff and email-enabled queues!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
