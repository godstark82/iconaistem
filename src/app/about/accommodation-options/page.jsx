import React from "react";
import AboutHeader from "../../../components/common/AboutHeader";

const hotels = [
    {
        name: "InterContinental Bahrain",
        image: "/images/hotels/intercontinental.jpg",
        link: "https://www.ihg.com/intercontinental/hotels/gb/en/manama/bahha/hoteldetail",
        note: "*Select <b>University of Technology Bahra*</b> as Rate Reference.",
    },
    {
        name: "Downtown Rotana",
        image: "/images/hotels/downtown.jpg",
        link: "https://eur06.safelinks.protection.outlook.com/?url=http%3A%2F%2Froho.it%2Fbgmg&data=05%7C02%7Ccrbansolay%40utb.edu.bh%7Ccfa6045b6ccb425e426e08ddabdfcfc4%7Cc599d08d7ffd46c98e6ccc8b13dbba77%7C0%7C0%7C638855699924365403%7CUnknown%7CTWFpbGZsb3d8eyJFbXB0eU1hcGkiOnRydWUsIlYiOiIwLjAuMDAwMCIsIlAiOiJXaW4zMiIsIkFOIjoiTWFpbCIsIldUIjoyfQ%3D%3D%7C0%7C%7C%7C&sdata=qiBIKXnECK6lFPOIUs5Uap3y7%2BmHuA%2FUiRO1tn3Xm4Y%3D&reserved=0",
        note: "*Use <b>ROSIDT</b> as the Booking Code"
    },
    {
        name: "Ibis",
        image: "/images/hotels/ibis.jpg",
        link: "https://all.accor.com/hotel/6702/index.en.shtml",
        note: "*Prior to booking, email <b><a href='mailto:Vanessa.vaquilar@accor.com'>Vanessa.vaquilar@accor.com</a></b> or <b><a href='https://wa.me/97335358850'>WhatsApp +973 35358850</a></b>",
    },
    {
        name: "The Westin City Centre Bahrain",
        image: null,
        link: "http://www.westincitycentrebahrain.com/",
        note: ""
    },
    {
        name: "Le Méridien City Centre Bahrain",
        image: null,
        link: "http://www.lemeridienbahraincitycentre.com/",
        note: "",
    },
];

export default function AccommodationOptionsPage() {
    return (
        <div className="min-h-screen bg-white">
            <AboutHeader
                title="Accommodation Options"
                date="September 5-7, 2025"
                image="/images/simdte-white-lg.png"
                overlayColor="#1a1a2e"
                bgImage="/images/utb-images/gallery/gallery-2.jpg"
                dividerColor="primary"
            />
            <div className="max-w-6xl mx-auto px-4 py-12">
                <div className="mb-8 text-lg text-gray-900">
                    <p className="mb-4">
                        We are pleased to offer our accommodation options for delegates attending <b>Sustainable Innovations in Management in the Digital Transformation Era (ICTAAA 2026)</b>, hosted by the <b>Arya College of Engineering & I.T. (Arya 1 Old Campus) Kukas, Jaipur</b>.
                    </p>
                    <p className="mb-4">
                        To ensure a comfortable and convenient stay, Arya College, Jaipur has partnered with some hotels located within close proximity to the conference venue and Arya College, Jaipur. These hotels offer a range of amenities and price points to suit various preferences and budgets.
                    </p>
                    <ul className="list-disc font-bold ml-8 mb-4">
                        <li>Hotels with exclusive rates for ICTAAA 2026 participants</li>
                        <li>Walking distance or short drive to the conference venue</li>
                        <li>Options ranging from budget to premium accommodation</li>
                    </ul>
                    <p>
                        For booking links, rates, and more information, please see the list below.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    {hotels.map((hotel, idx) => (
                        <div key={idx} className="flex flex-col items-start bg-white p-4">
                            <img src={hotel.image} alt={hotel.name} className="w-full h-48 object-cover rounded mb-4" />
                            <a
                                href={hotel.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-primary text-white px-4 py-2 rounded font-semibold text-lg mb-2 flex items-center gap-2 hover:bg-primary-dark transition"
                            >
                                {hotel.name} <span aria-hidden>🔗</span>
                            </a>
                            {hotel.note && (
                                <div className="text-xs text-gray-700 mt-2" dangerouslySetInnerHTML={{ __html: hotel.note }} />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
