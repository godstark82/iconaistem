"use client"
import React, { useState } from "react";
import AboutHeader from "../../components/common/AboutHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import PaperUploadSchema from "../../schema/paper-upload-schema";

// Email templates
const successEmailTemplate = (name, title) => `Dear ${name},

Thank you for submitting your paper "${title}" to ICTAAA 2026.

Your submission has been received and will be reviewed by our committee. You will be notified of the review outcome by September 15, 2026.

Best regards,
ICTAAA 2026 Committee`;

export default function UploadPaperPage() {
    const [form, setForm] = useState({
        paperTitle: "",
        paperAbstract: "",
        paperKeywords: "",
        uploadedFile: null,
        authorName: "",
        authorEmail: "",
        authorAffiliation: "",
        uploaderCountry: "",
    });
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        if (type === "file") {
            setForm({ ...form, uploadedFile: e.target.files[0] });
        } else {
            setForm({ ...form, [name]: value });
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus("");

        try {
            // Validate form data against schema
            const validatedData = PaperUploadSchema.parse({
                paperTitle: form.paperTitle,
                paperAbstract: form.paperAbstract,
                uploadedFile: form.uploadedFile,
                authorName: form.authorName,
                authorEmail: form.authorEmail,
                authorAffiliation: form.authorAffiliation,
                authorCountry: form.uploaderCountry,
            });

            const formData = new FormData();
            formData.append("paperTitle", validatedData.paperTitle);
            formData.append("paperAbstract", validatedData.paperAbstract);
            formData.append("uploadedFile", validatedData.uploadedFile);
            formData.append("authorName", validatedData.authorName);
            formData.append("authorEmail", validatedData.authorEmail);
            formData.append("authorAffiliation", validatedData.authorAffiliation);
            formData.append("authorCountry", validatedData.authorCountry);

            const res = await fetch("/api/paper-upload", {
                method: "POST",
                body: formData
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to upload paper');
            }

            // Send success email
            await fetch('/api/mailer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: form.authorEmail,
                    subject: "Paper Submission Successful - ICTAAA 2026",
                    text: successEmailTemplate(form.authorName, form.paperTitle)
                })
            });

            setShowModal(true);
            setStatus("Paper submitted successfully!");
            setForm({
                paperTitle: "",
                paperAbstract: "",
                uploadedFile: null,
                authorName: "",
                authorEmail: "",
                authorAffiliation: "",
                uploaderCountry: "",
            });
        } catch (error) {
            console.error('Upload error:', error);
            setStatus(`Submission failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <AboutHeader
                title="Upload Paper"
                date="5 - 7 September"
                image="/images/simdte-white-lg.png"
                overlayColor="#1a1a2e"
                bgImage="/images/utb-images/gallery/gallery-2.jpg"
                dividerColor="primary"
            />
            <div className="max-w-5xl mx-auto px-4 py-12">
                <div className="flex justify-center gap-4 mb-4">
                    <img src="/images/scopus-logo-hero.png" alt="Scopus" className="h-12 object-contain" />
                </div>
                <div className="bg-primary text-white text-center text-xl font-bold py-3 mb-8 rounded">Submission Guidelines</div>
                <div className="mb-8 text-gray-900">
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2">Submission Guidelines</h3>
                        <ul className="list-disc ml-8 mb-4">
                            <li>Original and unpublished research papers are invited.</li>
                            <li>
                                Submit papers at: <span className="font-semibold">[Insert submission link or email]</span>
                            </li>
                            <li>All submissions will undergo double-blind peer review.</li>
                        </ul>
                    </div>
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2">Publication Opportunities</h3>
                        <ul className="list-disc ml-8 mb-4">
                            <li>Selected papers will be published in Scopus-indexed / UGC-Care / peer-reviewed journals/ Proceedings.</li>
                            <li>All accepted Abstracts will appear in the Conference Souvenir Proceedings with an ISBN.</li>
                        </ul>
                    </div>
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2">Fees Details: For India</h3>
                        <ul className="list-disc ml-8 mb-4">
                            <li>Participation and Certificate (without Paper): <span className="font-semibold">Rs. 500/-</span></li>
                            <li>Participation and Certificate (with Paper presentation): <span className="font-semibold">Rs. 1000/-</span></li>
                            <li>Participation and Certificate (with Paper publication in Peer Review Journals): <span className="font-semibold">Rs. 2000/-</span></li>
                            <li>Participation and Certificate (with Paper publication in SCOPUS Proceedings/ SCOPUS Journal: Peer Review Journals): <span className="font-semibold">Rs. 1000/- + Publication Charges as per journal/Proceedings</span></li>
                        </ul>
                        <h3 className="text-lg font-semibold mb-2">Fees Details: For Non India participants</h3>
                        <ul className="list-disc ml-8 mb-4">
                            <li>Participation with certificate: <span className="font-semibold">$25</span></li>
                            <li>Participation with publications in SCOPUS Proceedings: <span className="font-semibold">$120</span></li>
                            <li>Participation with publications in SCOPUS Journals: <span className="font-semibold">$20 + APC of the Journal</span></li>
                        </ul>
                    </div>
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2">Mode of Presentation</h3>
                        <ul className="list-disc ml-8 mb-4">
                            <li>Both offline and Online options are available.</li>
                            <li>E-certificates will be provided to all participants and presenters.</li>
                        </ul>
                    </div>
                </div>
                <div id="submit-paper" className="bg-primary text-white text-center text-xl font-bold py-3 mb-8 rounded">Submit Your Paper
                    <div className="text-sm font-normal mt-1">Fill out the form below to submit your paper for review.</div>
                </div>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <input type="text" name="paperTitle" value={form.paperTitle} onChange={handleChange} placeholder="Paper Title" className="border border-gray-300 rounded px-3 h-10 w-full" required />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" name="authorName" value={form.authorName} onChange={handleChange} placeholder="Author's Full Name" className="border border-gray-300 rounded px-3 h-10" required />
                        <input type="email" name="authorEmail" value={form.authorEmail} onChange={handleChange} placeholder="Author's Email" className="border border-gray-300 rounded px-3 h-10" required />
                        <input type="text" name="authorAffiliation" value={form.authorAffiliation} onChange={handleChange} placeholder="Author's Affiliation" className="border border-gray-300 rounded px-3 h-10" required />
                        <input type="text" name="uploaderCountry" value={form.uploaderCountry} onChange={handleChange} placeholder="Uploader's Country" className="border border-gray-300 rounded px-3 h-10" required />
                        <div className="flex flex-col gap-2 md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Upload Paper (DOCX)</label>
                            <input
                                type="file"
                                onChange={handleChange}
                                className="border border-gray-300 rounded px-3 h-10"
                                accept="application/docx"
                                required
                            />
                        </div>
                        <textarea name="paperAbstract" value={form.paperAbstract} onChange={handleChange} placeholder="Abstract" className="border border-gray-300 rounded px-3 py-2 md:col-span-2 min-h-[120px]" required />
                    </div>
                    <p className="text-center font-bold">
                        *If you face any technical issues during submission, please email your paper directly to{' '}
                        <a href="mailto:submit@ICTAAA.com">
                            submit@ICTAAA.com
                        </a>
                    </p>

                    <div className="flex justify-center mt-6">
                        <Button type="submit" disabled={loading} className="text-lg text-white">
                            {loading ? "Submitting..." : "Submit Paper"}
                        </Button>
                    </div>
                    {status && <div className="text-center text-lg mt-4 text-primary font-semibold">{status}</div>}
                </form>
            </div>
            {/* Confirmation Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent showCloseButton>
                    <DialogHeader>
                        <DialogTitle className="bg-primary text-white text-center text-xl font-bold py-3 mb-6 rounded">
                            CONFIRMATION OF SUBMISSION
                        </DialogTitle>
                    </DialogHeader>
                    <div className="text-center mb-6">
                        <h2 className="text-lg font-bold mb-2">Thank You for Your Submission</h2>
                        <p className="mb-2">
                            Your paper has been successfully submitted to Sustainable Innovations in Management in the Digital Transformation Era (ICTAAA 2025), hosted by Arya College, Jaipur.
                        </p>
                        <p className="mb-2">
                            We appreciate your contribution and look forward to reviewing your work.<br />
                            Notifications of acceptance will be sent via email no later than 15 September 2025.
                        </p>
                        <div className="text-sm text-gray-600 mt-2">Stay tuned for updates.</div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button className="w-full text-white">Close</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
