"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import BookingCard from "@/components/cards/booking-card";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await axios.get("/api/itinerary/book");
        setBookings(res.data.bookings);
      } catch (err: any) {
        // In Axios, you may need to check err.response?.status
        if (err.response?.status === 401) {
          setError("You need to be logged in to view your bookings.");
        } else {
          setError("Failed to fetch bookings.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // Get user's current location
  const getUserLocation = async () => {
    setLoadingLocation(true);
    return new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setCurrentLocation(location);
          setLoadingLocation(false);
          resolve(location);
        },
        (error) => {
          setLoadingLocation(false);
          reject(error);
        }
      );
    });
  };

  // Opens the Uber ride URL for the given booking using the first winery's location as dropoff
  const openRideLink = (booking: any, service: "uber", location: { latitude: number; longitude: number }) => {
    const earliestWinery = booking.wineries[0];
    if (!earliestWinery || !earliestWinery.winery?.location) {
      alert("Dropoff location not available for this booking.");
      return;
    }
    const dropoffLatitude = earliestWinery.winery.location.latitude;
    const dropoffLongitude = earliestWinery.winery.location.longitude;
    // Set pickup time 30 minutes from now (in seconds)
    const pickupTime = Math.floor(Date.now() / 1000) + 30 * 60;
    let rideURL = "";
    if (service === "uber") {
      rideURL = `https://m.uber.com/ul/?action=setPickup&pickup[latitude]=${location.latitude}&pickup[longitude]=${location.longitude}&dropoff[latitude]=${dropoffLatitude}&dropoff[longitude]=${dropoffLongitude}&pickup_time=${pickupTime}&intent=ride`;
    }
    window.open(rideURL, "_blank");
  };

  // Handler passed to BookingCard to trigger ride booking
  const handleRideClick = async (booking: any, service: "uber") => {
    if (!currentLocation) {
      try {
        const location = await getUserLocation();
        openRideLink(booking, service, location);
      } catch {
        alert("Location access denied. Unable to book ride.");
      }
    } else {
      openRideLink(booking, service, currentLocation);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative md:top-10 top-5">
      <div className="lg:container">
        <h1 className="text-2xl font-bold mb-6">My Bookings</h1>
        {loading ? (
          <div className="flex justify-center items-center min-h-[50vh]">
            <span className="loading loading-dots loading-lg"></span>
          </div>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : bookings.length === 0 ? (
          <p className="text-center text-gray-500">No bookings found.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bookings.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                onBookUber={handleRideClick} // pass the ride handler
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
