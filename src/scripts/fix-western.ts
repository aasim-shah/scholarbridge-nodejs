import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function fixWesternScholarship() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/scholarships");
  const col = mongoose.connection.db!.collection("scholarships");

  const correctData = {
    title: "Western University National Scholarship Programme",
    organization: "Western University",
    country: "Canada",
    level: "Bachelor",
    field: "Any",
    category: "Merit-Based",
    deadline: new Date("2026-02-14"),
    description: "Comprehensive funding packages up to $100,000 for outstanding undergraduate students. Eligibility: Canadian Citizens or Permanent Residents (except International President's Entrance and President's Entrance for Black Students). Minimum 90% overall average on all Grade 12U/M courses (or equivalent). Must apply to Western's main campus and register as full-time student. International Baccalaureate and CEGEP students eligible. Beryl Ivey Continuing Entrance Scholarship has financial need component requiring supplemental application. Application: Submit OUAC application indicating Western's main campus. Complete online National Scholarship application using OUAC reference number. All documentation must be received (not postmarked) by February 14, 2026 deadline.",
    link: "https://registrar.uwo.ca/student_finances/scholarships_awards/admission/national_scholarship_program.html",
    amount: "Up to $100,000",
    currency: "CAD",
    is_verified: true,
    updated_at: new Date(),
  };

  const result = await col.updateOne(
    { _id: new mongoose.Types.ObjectId("698db07ffb4de38e76547003") },
    { $set: correctData }
  );

  console.log("Updated:", result.modifiedCount, "record");
  
  // Show updated record
  const updated = await col.findOne({ _id: new mongoose.Types.ObjectId("698db07ffb4de38e76547003") });
  console.log("\n=== UPDATED RECORD ===");
  console.log("Title:", updated.title);
  console.log("Description:", updated.description);
  console.log("Verified:", updated.is_verified);

  await mongoose.disconnect();
}

fixWesternScholarship().catch(console.error);
