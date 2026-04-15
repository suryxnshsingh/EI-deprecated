import React, { useState } from 'react';

const WaitingListPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleSubmit = async () => {
    if (!email) return;
    
    setIsSubmitting(true);
    setHasError(false);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSubmitted(true);
      setEmail('');
    } catch (error) {
      setHasError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Hero Section */}
      <div className="relative h-screen flex flex-col justify-center items-center">
        <div className="w-full max-w-6xl mx-auto px-8 relative z-10">
          <div className="text-center flex flex-col justify-between items-center w-full h-screen py-20">
            
            {/* Hero Text Holder */}
            <div className="max-w-4xl" style={{ filter: 'blur(0px)', opacity: 1 }}>
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold leading-tight mb-0 text-white">
                Lorem ipsum dolor sit amet.
              </h1>
            </div>

            {/* Hero Content Holder */}
            <div className="flex flex-col items-center gap-10 w-full">
              
              {/* Paragraph Holder */}
              <div className="max-w-md" style={{ opacity: 1, filter: 'blur(0px)' }}>
                <p className="text-white/80 text-lg leading-relaxed font-normal">
                  Lorem ipsum dolor, sit amet consectetur adipisicing elit. Delectus laudantium dolore id eos nostrum architecto.
                </p>
              </div>

              {/* Form Wrapper */}
              <div className="flex flex-col items-center gap-6 w-full mb-16" style={{ opacity: 1, filter: 'blur(0px)' }}>
                
                {/* Form Block */}
                <div className="w-full max-w-md">
                  {!isSubmitted ? (
                    <div className="flex items-center relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter email here"
                        maxLength="256"
                        required
                        className="w-full h-14 px-5 bg-black/30 border-2 border-white/25 rounded-full text-white placeholder-white/50 text-lg focus:border-purple-500 focus:outline-none transition-all duration-300 hover:border-white/40"
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '18px',
                          transition: 'border-color 0.45s, box-shadow 0.425s'
                        }}
                      />
                      <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !email}
                        className="absolute right-2 w-10 h-10 bg-black rounded-full flex items-center justify-center hover:bg-purple-600 transition-all duration-375 disabled:opacity-50"
                        style={{
                          backgroundImage: 'url("https://cdn.prod.website-files.com/677d8349ca091f8535fc00b0/677d8349ca091f8535fc00dd_Arrow.svg")',
                          backgroundPosition: '50%',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: 'auto'
                        }}
                      >
                        {isSubmitting && (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div 
                      className="w-full h-14 rounded-lg flex items-center justify-center text-white font-medium text-base"
                      style={{
                        backgroundImage: 'linear-gradient(0deg, black, #5b00ce 43%, white)',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '15px',
                        fontWeight: 500
                      }}
                    >
                      Thank you! Your submission has been received!
                    </div>
                  )}

                  {hasError && (
                    <div 
                      className="w-full p-3 border rounded-lg text-white text-sm text-center mt-2"
                      style={{
                        color: '#fff',
                        backgroundColor: '#33333347',
                        border: '1px solid #aa5252',
                        borderRadius: '8px',
                        fontSize: '14px',
                        boxShadow: '0 4px 4px rgba(0,0,0,0.24), 0 0 14px rgba(0,0,0,0.24), 0 21px 36px rgba(255,0,4,0.12)'
                      }}
                    >
                      Oops! Something went wrong while submitting the form.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Design */}
      <div className="absolute inset-0 flex flex-col justify-center items-center">
        {/* List Image Holder (Blur Overlay) - Now positioned below */}
        <div className="absolute inset-0 w-full h-full p-8 z-0">
          <img 
            src="https://cdn.prod.website-files.com/677d8349ca091f8535fc00b0/677da1ab56175113de3c71cf_Blur%20Half.svg" 
            alt="Blur Half"
            className="w-full h-full object-cover rounded-3xl"
            style={{ 
              transform: 'translate3d(0px, 0px, 0px) scale3d(1, 1, 1) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skew(0deg, 0deg)',
              opacity: 1,
              transformStyle: 'preserve-3d'
            }}
            loading="lazy"
          />
        </div>
        
        {/* Main Image - Now positioned above */}
        <img 
          className="w-full h-full object-cover relative z-10"
          src="https://cdn.prod.website-files.com/677d8349ca091f8535fc00b0/677da2780ef19502cbb85e54_Main%2002.webp" 
          alt="Background"
          style={{ 
            transform: 'translate3d(0px, 0px, 0px) scale3d(1, 1, 1) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skew(0deg, 0deg)',
            opacity: 1,
            transformStyle: 'preserve-3d'
          }}
          sizes="100vw"
          loading="lazy"
          srcSet="https://cdn.prod.website-files.com/677d8349ca091f8535fc00b0/677da2780ef19502cbb85e54_Main%2002-p-500.webp 500w, https://cdn.prod.website-files.com/677d8349ca091f8535fc00b0/677da2780ef19502cbb85e54_Main%2002-p-800.webp 800w, https://cdn.prod.website-files.com/677d8349ca091f8535fc00b0/677da2780ef19502cbb85e54_Main%2002-p-1080.webp 1080w, https://cdn.prod.website-files.com/677d8349ca091f8535fc00b0/677da2780ef19502cbb85e54_Main%2002-p-1600.webp 1600w, https://cdn.prod.website-files.com/677d8349ca091f8535fc00b0/677da2780ef19502cbb85e54_Main%2002-p-2000.png 2000w, https://cdn.prod.website-files.com/677d8349ca091f8535fc00b0/677da2780ef19502cbb85e54_Main%2002-p-2600.png 2600w, https://cdn.prod.website-files.com/677d8349ca091f8535fc00b0/677da2780ef19502cbb85e54_Main%2002-p-3200.png 3200w, https://cdn.prod.website-files.com/677d8349ca091f8535fc00b0/677da2780ef19502cbb85e54_Main%2002.webp 3480w"
        />
        

        {/* Light Wrapper */}
        <div 
          className="absolute inset-0 flex justify-end items-center"
          style={{ 
            transform: 'translate3d(0px, 0px, 0px) scale3d(1, 1, 1) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skew(0deg, 0deg)',
            opacity: 1,
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Lights Holder */}
          <div 
            className="flex justify-center items-center w-full h-full absolute opacity-70"
            style={{
              top: '-27%',
              left: '8%',
              transform: 'rotate(18deg)',
              gap: '70px'
            }}
          >
            {/* Left Light */}
            <div 
              className="bg-gradient-to-b from-purple-400/20 to-transparent"
              style={{
                opacity: 0.4,
                filter: 'blur(9px)',
                backgroundImage: 'linear-gradient(#ac64e2 5%, rgba(70, 31, 116, 0) 67%)',
                width: '100px',
                height: '1390px',
                left: '442.5px'
              }}
            />
            
            {/* Middle Light */}
            <div 
              className="bg-gradient-to-b from-purple-400/20 to-transparent"
              style={{
                opacity: 0.4,
                filter: 'blur(18px)',
                backgroundImage: 'linear-gradient(#ac64e2 5%, rgba(70, 31, 116, 0) 67%)',
                width: '190px',
                height: '1600px'
              }}
            />
            
            {/* Right Light */}
            <div 
              className="bg-gradient-to-b from-purple-400/20 to-transparent"
              style={{
                opacity: 0.5,
                filter: 'blur(16px)',
                backgroundImage: 'linear-gradient(#ac64e2 5%, rgba(70, 31, 116, 0) 67%)',
                width: '130px',
                height: '1300px',
                right: '400px'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitingListPage;