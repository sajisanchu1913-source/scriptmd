package com.scriptmd.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "prescriptions")
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Patient ID — unique number per patient, never changes
    // Even if two patients are both named "John Smith" they have different patientId
    private Long patientId;
    private String patientName;
    private String doctorName;

    @Column(columnDefinition = "TEXT")
    private String symptoms;

    @Column(columnDefinition = "TEXT")
    private String medicine;

    private String dosage;
    private String duration;
    private String frequency;

    @Column(columnDefinition = "TEXT")
    private String originalText;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }
    public String getPatientName() { return patientName; }
    public void setPatientName(String n) { this.patientName = n; }
    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String n) { this.doctorName = n; }
    public String getSymptoms() { return symptoms; }
    public void setSymptoms(String s) { this.symptoms = s; }
    public String getMedicine() { return medicine; }
    public void setMedicine(String m) { this.medicine = m; }
    public String getDosage() { return dosage; }
    public void setDosage(String d) { this.dosage = d; }
    public String getDuration() { return duration; }
    public void setDuration(String d) { this.duration = d; }
    public String getFrequency() { return frequency; }
    public void setFrequency(String f) { this.frequency = f; }
    public String getOriginalText() { return originalText; }
    public void setOriginalText(String t) { this.originalText = t; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
