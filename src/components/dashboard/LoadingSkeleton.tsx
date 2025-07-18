export default function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <div className="w-20 h-4 bg-gray-200 rounded"></div>
          </div>
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
            <div className="flex -space-x-2">
              {[1, 2, 3].map((j) => (
                <div
                  key={j}
                  className="w-8 h-8 bg-gray-200 rounded-full"
                ></div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}