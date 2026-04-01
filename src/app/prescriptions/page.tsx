import { PrescriptionUploadForm } from '@/components/prescription-upload-form'
import { PrescriptionTracker } from '@/components/prescription-tracker'

export default function PrescriptionsPage() {
  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <span className="badge">Prescriptions</span>
          <h1>Upload and track prescription files</h1>
          <p className="muted">
            Customers can attach documents to an existing order number and track the status in one place.
          </p>
        </div>
      </div>

      <div className="two-col">
        <PrescriptionUploadForm />
        <PrescriptionTracker />
      </div>
    </section>
  )
}
