package com.scriptmd.repository;

import com.scriptmd.model.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {

    // Find by patient ID — most reliable, ID is always unique
    List<Prescription> findByPatientId(Long patientId);

    // Find by patient name — useful for search bar
    // "Containing" means partial match — searching "john" finds "John Smith"
    List<Prescription> findByPatientNameContaining(String patientName);

    // Find by doctor name
    List<Prescription> findByDoctorName(String doctorName);

    // Get all prescriptions newest first — for Recent Prescriptions card
    List<Prescription> findAllByOrderByCreatedAtDesc();
}