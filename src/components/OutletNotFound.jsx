function OutletNotFound() {
  return (
    <div className="container mx-auto min-h-screen flex items-center justify-center">
      <div className="text-center p-4 rounded-2xl">
        <img 
          src="/src/assets/images/scanQr.gif" 
          alt="Scan QR Code" 
          className="w-full max-w-[200px] h-[200px] mb-4 rounded-2xl mx-auto"
        />
        <h5 className="mt-3 text-lg font-medium">Outlet having issue. 
        <br />
        Rescan the QR Code again!</h5>
      </div>
    </div>
  )
}

export default OutletNotFound