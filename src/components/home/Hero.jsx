'use client'
export default function Hero() {
    return (
        <div className="bg-secondary pb-8">
            <div className="container mx-auto px-4">
                <div className="flex flex-col items-center justify-center py-8 md:py-12">
                    <div className="flex flex-col items-center gap-2 md:gap-4">
                        <span className="text-5xl md:text-3xl font-bold text-[#E13A59] tracking-tight leading-none" style={{ letterSpacing: '-0.04em' }}>
                            IC-TAAA <span className="text-2xl md:text-3xl font-bold text-white">2025</span>
                        </span>
                    </div>
                    <div className="mt-2 md:mt-4 max-w-5xl">
                        <span className="text-lg md:text-2xl lg:text-5xl text-white font-medium tracking-wide text-center block">
                            International Conference on Technological Advances in AI and it's Applications
                        </span>
                    </div>
                    <br />
                    <div className="mt-1">
                        <span className="text-base md:text-lg lg:text-2xl text-primary font-semibold tracking-wide text-center block">
                            (Special session on Bio Sciences)
                        </span>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-6">
                    <div className="text-center text-white w-full md:w-auto">
                        <button
                            className="border border-white text-light px-6 py-2 hover:bg-white hover:text-secondary transition-colors w-full md:w-auto"
                            onClick={() => window.location.href = '/upload-paper'}
                        >
                            Submit Paper
                        </button>
                    </div>
                    <div className="text-center text-white bg-primary p-2 w-full md:w-auto rounded">
                        <p className="text-white text-lg md:text-xl font-semibold">September 6-7, 2025</p>
                    </div>
                    <div className="text-center text-white w-full md:w-auto">
                        <img
                            src="images/scopus-logo-hero.png"
                            alt="Scopus Logo"
                            className="max-w-[120px] md:max-w-[150px] w-full h-auto mx-auto"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}