import { Link } from "react-router-dom";

function OutletNotFound() {
  return (
    <div className="container mx-auto min-h-screen flex items-center justify-center">
      <div className="text-center p-4 rounded-2xl max-w-sm">
        <img
          src="/src/assets/images/scanQr.gif"
          alt="Scan QR Code"
          className="w-full max-w-[200px] h-[200px] mb-4 rounded-2xl mx-auto"
        />
        <h5 className="mt-3 text-lg font-medium">
          Outlet having issue.
          <br />
          Rescan the QR Code again!
        </h5>
        <p className="mt-2 text-sm text-gray-500">
          Or browse available restaurants on this server.
        </p>
        <Link
          to="/all-outlets"
          className="inline-block mt-4 px-4 py-2 rounded-lg bg-green-600 text-white font-medium no-underline hover:bg-green-700"
        >
          Browse All Outlets
        </Link>
      </div>
    </div>
  );
}

export default OutletNotFound;
