const exists = await JobPosting.findOne({ applyLink: jobUrl });
                        
                        // if (!exists) {
                        //     try {
                        //         await JobPosting.create({
                        //             companyName: company.name,
                        //             role: job.title,
                        //             location: job.locationsText || 'India',
                        //             salaryRaw: "Competitive", 
                        //             applyLink: jobUrl,
                        //             scrapedAt: job.postedOn ? new Date(job.postedOn) : new Date()
                        //         });
                        //         jobsAdded++;
                        //         totalAddedAcrossAll++;
                        //     } catch (dbError) {
                        //         if (dbError.code !== 11000) {
                        //             console.error("Database Error:", dbError.message);
                        //         }
                        //     }
                        // }