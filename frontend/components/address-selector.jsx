import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Loader2 } from "lucide-react";

const DATA_SOURCE = {
  PROVINCE: "/address/province.json",
  WARD: "/address/ward.json"
};

export default function AddressSelector({ value, onChange, disabled }) {
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load Data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [provRes, wardRes] = await Promise.all([
          axios.get(DATA_SOURCE.PROVINCE),
          axios.get(DATA_SOURCE.WARD)
        ]);
        
        // Convert object to array
        const provArray = Object.values(provRes.data).sort((a, b) => a.name.localeCompare(b.name));
        const wardArray = Object.values(wardRes.data);
        
        setProvinces(provArray);
        setWards(wardArray);
        setDataLoaded(true);
      } catch (error) {
        console.error("Error fetching address data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter wards based on selected city
  const filteredWards = useMemo(() => {
    if (!value.city) return [];
    const selectedProv = provinces.find(p => p.name === value.city);
    if (!selectedProv) return [];
    
    return wards.filter(w => w.parent_code === selectedProv.code).sort((a, b) => a.name.localeCompare(b.name));
  }, [value.city, provinces, wards]);

  const handleCityChange = (e) => {
    const city = e.target.value;
    onChange({
      ...value,
      city,
      district: "", // District is not supported in this dataset
      ward: ""
    });
  };

  const handleWardChange = (e) => {
    onChange({
      ...value,
      ward: e.target.value
    });
  };

  const handleStreetChange = (e) => {
    onChange({
      ...value,
      street: e.target.value
    });
  };

  const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder-gray-500 transition-all disabled:opacity-50";

  return (
    <div className="space-y-4">
      {/* Province / City */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Tỉnh / Thành phố</label>
        <div className="relative">
             <select
                disabled={disabled || loading}
                value={value.city || ""}
                onChange={handleCityChange}
                className={inputClass}
            >
                <option value="" className="bg-gray-800 text-gray-400">Chọn Tỉnh / Thành phố</option>
                {provinces.map(p => (
                    <option key={p.code} value={p.name} className="bg-gray-800 text-white">
                        {p.name}
                    </option>
                ))}
            </select>
             {loading && <Loader2 className="absolute right-3 top-3 w-5 h-5 animate-spin text-gray-400" />}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ward */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Phường / Xã</label>
             <div className="relative">
                <select
                    disabled={disabled || !value.city || !dataLoaded}
                    value={value.ward || ""}
                    onChange={handleWardChange}
                    className={inputClass}
                >
                    <option value="" className="bg-gray-800 text-gray-400">Chọn Phường / Xã</option>
                    {filteredWards.map(w => (
                        <option key={w.code} value={w.name} className="bg-gray-800 text-white">
                            {w.name}
                        </option>
                    ))}
                </select>
            </div>
          </div>
          
           {/* Street */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Số nhà, tên đường</label>
                <input
                    type="text"
                    disabled={disabled}
                    value={value.street || ""}
                    onChange={handleStreetChange}
                    placeholder="Ví dụ: 123 Đường Nguyễn Văn Linh"
                    className={inputClass}
                />
            </div>
      </div>
    </div>
  );
}
