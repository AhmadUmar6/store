export default function ContactPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-24">
      <div className="text-center mb-12">
        <h1 
          className="text-4xl font-light mb-4" 
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Contact Us
        </h1>
        <p className="text-[#FBC000] text-lg">
          We'd love to hear from you. Get in touch for any inquiries or feedback.
        </p>
      </div>
      <form className="space-y-6 max-w-lg mx-auto">
        <div>
          <label htmlFor="name" className="block text-gray-700 text-sm font-semibold mb-2">
            Name
          </label>
          <input
            type="text"
            id="name"
            placeholder="Your name"
            className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#FBC000] transition text-black"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-gray-700 text-sm font-semibold mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            placeholder="name@example.com"
            className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#FBC000] transition text-black"
          />
        </div>
        <div>
          <label htmlFor="message" className="block text-gray-700 text-sm font-semibold mb-2">
            Message
          </label>
          <textarea
            id="message"
            rows="4"
            placeholder="Your message"
            className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#FBC000] transition text-black"
          ></textarea>
        </div>
        <button
          type="submit"
          className="w-full px-8 py-3 bg-[#FBC000] text-black font-semibold rounded hover:bg-opacity-90 transition-all tracking-wider"
        >
          Send Message
        </button>
      </form>
    </div>
  );
}
