import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function auditDescriptions() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/scholarships");
  const col = mongoose.connection.db!.collection("scholarships");

  const all = await col.find({}).sort({ deadline: 1 }).toArray();
  
  console.log(`=== Auditing ${all.length} scholarships for description quality ===\n`);
  
  const issues: any[] = [];
  
  for (const s of all) {
    const desc = s.description || "";
    const issues_found: string[] = [];
    
    // Check for vague descriptions
    if (desc.length < 100) {
      issues_found.push(`Short description (${desc.length} chars)`);
    }
    
    // Check if eligibility criteria is mentioned
    if (!desc.toLowerCase().includes("eligib") && !desc.toLowerCase().includes("requir") && !desc.toLowerCase().includes("must")) {
      issues_found.push("No eligibility criteria mentioned");
    }
    
    // Check if it's too generic
    const genericPhrases = [
      "provides scholarships",
      "offers funding",
      "supports students",
      "comprehensive funding",
    ];
    if (genericPhrases.some(phrase => desc.toLowerCase().includes(phrase)) && desc.length < 150) {
      issues_found.push("Generic/vague wording");
    }
    
    if (issues_found.length > 0) {
      issues.push({
        id: s._id.toString(),
        title: s.title,
        org: s.organization,
        link: s.link,
        desc_length: desc.length,
        description: desc,
        issues: issues_found,
        verified: s.is_verified || false,
      });
    }
  }
  
  console.log(`Found ${issues.length} scholarships with potential description issues:\n`);
  
  for (const item of issues) {
    console.log(`❌ ${item.title}`);
    console.log(`   Org: ${item.org}`);
    console.log(`   Link: ${item.link}`);
    console.log(`   Issues: ${item.issues.join(", ")}`);
    console.log(`   Verified: ${item.verified}`);
    console.log(`   Current desc: "${item.description.substring(0, 100)}..."`);
    console.log();
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`Total scholarships: ${all.length}`);
  console.log(`With issues: ${issues.length}`);
  console.log(`Verified: ${all.filter(s => s.is_verified).length}`);

  await mongoose.disconnect();
}

auditDescriptions().catch(console.error);
