import SectionHeader from "../common/SectionHeader";

const CHAIRS = [
    {
        name: 'DR HAITHAM ALQAHTANI',
        title: 'Executive Conference Chair',
        img: '/images/haitham.jpg', // Replace with actual image path
    },
    {
        name: 'DR SHABANA FAIZAL',
        title: 'Conference Chair',
        img: '/images/shabana.jpg', // Replace with actual image path
    },
];

export default function Overview() {
    return (
        <section className="bg-white py-12">
            <div className="container mx-auto px-4">
                {/* Title */}
                <SectionHeader title="Conference Overview" />
                <div className="text-black text-lg text-justify space-y-4">
                    <p>
                        The second edition of the International Conference on Technological Advances in AI and it's Applications (IC-TAAA 2026), organised by Arya College of Engineering & I.T., will focus on advancing creative thinking in management and informatics within the context of digital business transformation. Anchored in the goals of sustainable development and technological progress, the conference seeks to address contemporary business and technological challenges through rigorous academic dialogue and research-driven inquiry.
                    </p>
                    <p>
                        Bringing together scholars, practitioners, and industry leaders, the conference will serve as a platform for the exchange of knowledge, presentation of innovative ideas, and exploration of forward-thinking solutions through engaging panel and keynote discussions.
                    </p>
                    <p>
                        This dynamic gathering aims to spark intellectual curiosity, drive impactful research, and cultivate meaningful collaborations that contribute to sustainable progress in science, engineering, management, and technology.
                    </p>
                </div>
            </div>
        </section>
    );
}
