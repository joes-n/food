import { Link } from 'react-router-dom';

export function Home() {
  return (
    <div>
      {/* Banner Section */}
      <div className="relative bg-[#10b981] bg-[url('https://i.imgur.com/07g3z1E.png')] bg-center text-white py-20">
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-6xl font-bold mb-4">🗣️Let us eat!!</h1>
          <p className="text-xl mb-8">
            Discover great meals from local restaurants and track your delivery in real-time
          </p>
          <Link to="/restaurants" className="bg-white text-[#10b981] px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors">
            Browse Restaurants
          </Link>
        </div>
      </div>

      {/* Popular Cuisines */}
      <div className="bg-lime-400 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-[#ffffff]">Popular Cuisines</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[
              { name: 'Italian', emoji: '🍝' },
              { name: 'Chinese', emoji: '🥡' },
              { name: 'Indian', emoji: '🍛' },
              { name: 'Mexican', emoji: '🌮' },
              { name: 'American', emoji: '🍔' },
            ].map((cuisine) => (
              <Link
                key={cuisine.name}
                to={`/restaurants?cuisine=${cuisine.name.toLowerCase()}`}
                className="bg-white rounded-lg p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className="text-4xl mb-2">{cuisine.emoji}</div>
                <div className="font-semibold">{cuisine.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Order?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of satisfied customers ordering from their favorite restaurants
          </p>
          <Link to="/restaurants" className="btn-primary inline-block px-8 py-3">
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
