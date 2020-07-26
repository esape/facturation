import React, { useState, useEffect } from 'react'
import DatePicker from 'react-date-picker'
import uuid from 'uuid'
import './App.sass'

const VAT_RATE = 0.2

interface Client {
  name: string
  address: string
  intracommunautaryNumber: string
  invoiceAddress: string
  deliveryAddress: string
}

class Service {
  id: string
  date: {
    from: Date
    to: Date | null
  }
  title: string
  quantity: number
  unitPrice: number
  VATRate: number
  withoutTaxAmount: number
  taxAmount: number
  taxIncludedAmount: number

  constructor(
    from: Date,
    to: Date | null,
    title: string,
    quantity: number,
    unitPrice: number,
  ) {
    this.id = uuid()
    this.date = {
      from,
      to,
    }
    this.title = title
    this.quantity = quantity
    this.unitPrice = unitPrice

    this.VATRate = VAT_RATE
    this.withoutTaxAmount = quantity * unitPrice
    this.taxAmount = this.withoutTaxAmount * this.VATRate
    this.taxIncludedAmount = this.withoutTaxAmount + this.taxAmount
  }
}

class Invoice {
  date: Date
  invoiceNumber: string
  client: Client
  services: Service[]
  paymentDate: Date

  constructor(invoiceNumber: string, date: Date, paymentDate: Date, client: Client, services: Service[]) {
    this.invoiceNumber = invoiceNumber
    this.date = date
    this.paymentDate = paymentDate
    this.client = client
    this.services = services
  }

  withoutTaxTotalAmount() {
    return this.services.reduce((acc, cur) => acc + cur.withoutTaxAmount, 0)
  }

  taxTotalAmount() {
    return this.services.reduce((acc, cur) => acc + cur.taxAmount, 0)
  }

  taxIncludedTotalAmount() {
    return this.services.reduce((acc, cur) => acc + cur.taxIncludedAmount, 0)
  }
}

const isInt = (x: number) => x - Math.floor(x) === 0

const percentFormatted = (x: number) => `${Math.round(x * 100)} %`
const defaultFormatted = (x: number) =>
  isInt(x)
    ? `${x.toLocaleString('fr-FR')}`
    : `${Number(x.toFixed(2)).toLocaleString('fr-FR')}`
const financeFormatted = (x: number) =>
  x.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

const App = () => {
  const [invoiceNumber, setInvoiceNumber] = useState<string>('')
  const [date, setDate] = useState<Date>(new Date())
  const [paymentDate, setPaymentDate] = useState<Date | null>(null)
  const [clientName, setClientName] = useState<string>('')
  const [clientAddress, setClientAddress] = useState<string[]>([])
  const [
    clientIntracommunautaryNumber,
    setClientIntracommunautaryNumber,
  ] = useState<string>('')
  const [clientInvoiceAddress, setClientInvoiceAddress] = useState<string[]>([])
  const [clientDeliveryAddress, setClientDeliveryAddress] = useState<string[]>(
    [],
  )
  const [newServiceStartDate, setNewServiceStartDate] = useState<
    Date | undefined
  >(undefined)
  const [newServiceEndDate, setNewServiceEndDate] = useState<Date | undefined>(
    undefined,
  )
  const [newServiceDescription, setNewServiceDescription] = useState<string>('')
  const [newServiceQuantity, setNewServiceQuantity] = useState<string>('')
  const [newServiceUnitPrice, setNewServiceUnitPrice] = useState<string>('')
  const [services, setServices] = useState<Service[]>([])
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [askedForPrint, setAskedForPrint] = useState<boolean>(false)

  const resetNewServiceData = () => {
    setNewServiceStartDate(undefined)
    setNewServiceEndDate(undefined)
    setNewServiceDescription('')
    setNewServiceQuantity('')
    setNewServiceUnitPrice('')
  }

  const addNewService = () => {
    try {
      if (!newServiceStartDate)
        throw new Error('La date de début est incorrecte')
      const endDate = newServiceEndDate ? newServiceEndDate : null
      if (!newServiceDescription)
        throw new Error('Il manque la description du service')
      // eslint-disable-next-line no-useless-escape
      const numberValidator = /^\d+[\.|\,]?\d*$/
      if (!numberValidator.test(newServiceQuantity))
        throw new Error('La quantité est invalide')
      if (!numberValidator.test(newServiceUnitPrice))
        throw new Error('Le prix unitaire est invalide')
      setServices(
        services.concat([
          new Service(
            newServiceStartDate,
            endDate,
            newServiceDescription,
            Number(newServiceQuantity),
            Number(newServiceUnitPrice),
          ),
        ]),
      )
      resetNewServiceData()
    } catch (e) {
      alert(e.message)
    }
  }

  const removeService = (service: Service) => {
    const remove = window.confirm(
      `Es-tu sûr de vouloir supprimer : ${service.title} ?`,
    )
    if (remove) {
      setServices(services.filter(s => s.id !== service.id))
    }
  }

  const generatePrint = () => {
    try {
      // if (!invoiceNumber) throw new Error('Il manque le numéro de facture')
      if (!paymentDate) throw new Error('Il faut choisir une date de paiement')
      setInvoice(
        new Invoice(
          invoiceNumber,
          date,
          paymentDate,
          {
            name: clientName,
            intracommunautaryNumber: clientIntracommunautaryNumber,
            address: clientAddress.join('\n'),
            invoiceAddress: clientInvoiceAddress.join('\n'),
            deliveryAddress: clientDeliveryAddress.join('\n'),
          },
          services,
        ),
      )
      setAskedForPrint(true)
    } catch (e) {
      alert(e.message)
    }
  }

  useEffect(() => {
    if (invoice && askedForPrint) {
      window.print()
      setAskedForPrint(false)
      const savedData = window.localStorage.getItem('invoices')
      const previousInvoices: Invoice[] = savedData ? JSON.parse(savedData) : []
      window.localStorage.setItem(
        'invoices',
        JSON.stringify(previousInvoices.concat([invoice])),
      )
    }
  }, [invoice, askedForPrint])

  return (
    <div className='App'>
      <div id='invoiceForm'>
        <h2>Général</h2>
        <div className='column generalInfo'>
          <label>
            <span className='bold'>Numéro de facture</span>
            <input
              className='border-black border-round height-30 mono'
              type='text'
              onChange={event => setInvoiceNumber(event.target.value)}
              value={invoiceNumber}
            />
          </label>
          <label>
            <span className='bold'>Date de la facture</span>
            <DatePicker
              className='border-round border-black'
              onChange={date =>
                date instanceof Array ? setDate(date[0]) : setDate(date)
              }
              value={date}
            />
          </label>
          <label>
            <span className='bold'>Date de paiement</span>
            <DatePicker
              className='border-round border-black'
              onChange={date =>
                date instanceof Array
                  ? setPaymentDate(date[0])
                  : setPaymentDate(date)
              }
              value={paymentDate ? paymentDate : undefined}
            />
          </label>
        </div>
        <h2>Client</h2>
        <div className='row'>
          <div className='left column flex-end'>
            <label>
              <span className='bold'>Nom</span>
              <input
                className='border-black border-round height-30 mono'
                type='text'
                onChange={event => setClientName(event.target.value)}
                value={clientName}
              />
            </label>
            <label>
              <span className='bold'>N° intracommunautaire</span>
              <input
                className='border-black border-round height-30 mono'
                type='text'
                onChange={event =>
                  setClientIntracommunautaryNumber(event.target.value)
                }
                value={clientIntracommunautaryNumber}
              />
            </label>
          </div>
          <div className='right addressBox'>
            <label>
              <span className='bold'>Adresse</span>
              <textarea
                className='border-black border-round height-100'
                onChange={event =>
                  setClientAddress(event.target.value.split('\n'))
                }
                value={clientAddress.join('\n')}
              />
            </label>
          </div>
        </div>
        <div className='row'>
          <div className='left addressBox'>
            <label>
              <span className='bold'>Adresse de facturation</span>
              <textarea
                className='border-black border-round height-100'
                onChange={event =>
                  setClientInvoiceAddress(event.target.value.split('\n'))
                }
                value={clientInvoiceAddress.join('\n')}
              />
            </label>
          </div>
          <div className='right addressBox'>
            <label>
              <span className='bold'>Adresse de livraison</span>
              <textarea
                className='border-black border-round height-100'
                onChange={event =>
                  setClientDeliveryAddress(event.target.value.split('\n'))
                }
                value={clientDeliveryAddress.join('\n')}
              />
            </label>
          </div>
        </div>
        <h2>Prestations</h2>
        <table>
          <thead>
            <tr>
              <td>Début</td>
              <td>(Fin)</td>
              <td>Désignation de la prestation</td>
              <td>Quantité</td>
              <td>Prix unitaire</td>
              <td>Action</td>
            </tr>
          </thead>
          <tbody>
            {services.map(service => {
              return (
                <tr key={service.id}>
                  <td className='width-80'>
                    {service.date.from.toLocaleDateString()}
                  </td>
                  <td className='width-80'>
                    {service.date.to && service.date.to.toLocaleDateString()}
                  </td>
                  <td className='width-040'>{service.title}</td>
                  <td className='align-center'>{service.quantity}</td>
                  <td className='align-center'>{service.unitPrice}</td>
                  <td>
                    <button
                      className='removeService'
                      onClick={event => {
                        event.preventDefault()
                        removeService(service)
                      }}
                    >
                      -
                    </button>
                  </td>
                </tr>
              )
            })}
            <tr>
              <td className='width-80'>
                <DatePicker
                  value={newServiceStartDate}
                  onChange={date =>
                    setNewServiceStartDate(
                      date instanceof Array ? date[0] : date,
                    )
                  }
                />
              </td>
              <td className='width-80'>
                <DatePicker
                  value={newServiceEndDate}
                  onChange={date =>
                    setNewServiceEndDate(date instanceof Array ? date[0] : date)
                  }
                />
              </td>
              <td className='width-040'>
                <input
                  type='text'
                  className='border-black border-round height-30 full-width font-14'
                  value={newServiceDescription}
                  onChange={event =>
                    setNewServiceDescription(event.target.value)
                  }
                />
              </td>
              <td className='align-center'>
                <input
                  type='number'
                  className='border-black border-round height-30 mono width-80 font-14'
                  value={newServiceQuantity}
                  onChange={event => setNewServiceQuantity(event.target.value)}
                />
              </td>
              <td className='align-center'>
                <input
                  type='number'
                  className='border-black border-round height-30 mono width-80 font-14'
                  value={newServiceUnitPrice}
                  onChange={event => setNewServiceUnitPrice(event.target.value)}
                />
              </td>
              <td>
                <button
                  id='addService'
                  onClick={event => {
                    event.preventDefault()
                    addNewService()
                  }}
                >
                  +
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div className='footer'>
          {/* {invoiceNumber && */}
          {
            paymentDate &&
            clientName &&
            // clientIntracommunautaryNumber &&
            clientAddress.length &&
            clientAddress[0] &&
            !!services.length && (
              <button
                id='printButton'
                onClick={async () => {
                  generatePrint()
                }}
              >
                Imprimer la facture
              </button>
            )}
        </div>
      </div>

      {invoice && (
        <div id='invoicePrint'>
          <h1 className='title'>Facture</h1>
          <div className='generalInfo'>
            <div className='left'>
              <div className='block'>
                <p className='bold'>ESAPE</p>
                <p>6 rue de Bois-Bernard</p>
                <p>62580 NEUVIREUIL</p>
              </div>
              <div className='block'>
                <p>SARL ESAPE</p>
                <p>Au capital social de 22 500,00 euros</p>
              </div>
              <div className='block'>
                <p>RCS ARRAS 812.462.307</p>
                <p>TVA intracommunautaire: fr 33812462307</p>
              </div>
            </div>
            <div className='right'>
              <div className='block'>
                <p className='align-right'>
                  Date : {invoice.date.toLocaleDateString()}
                </p>
                <p className='align-right bold'>
                  Facture n° {invoice.invoiceNumber}
                </p>
              </div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <td colSpan={2} className='nowrap border-right'>
                  Références client
                </td>
                <td className='nowrap border-right'>Adresse de facturation</td>
                <td className='nowrap'>Adresse de livraison</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className='align-right bold'>Nom :</td>
                <td className='align-center border-right'>
                  {invoice.client.name}
                </td>
                <td rowSpan={3} className='align-center border-right pre-line'>
                  {invoice.client.invoiceAddress}
                </td>
                <td rowSpan={3} className='align-center pre-line'>
                  {invoice.client.deliveryAddress}
                </td>
              </tr>
              <tr>
                <td className='align-right bold'>Adresse :</td>
                <td className='align-center pre-line'>
                  {invoice.client.address}
                </td>
              </tr>
              <tr>
                <td className='align-right nowrap bold'>
                  N° intracommunautaire :
                </td>
                <td className='align-center'>
                  {invoice.client.intracommunautaryNumber}
                </td>
              </tr>
            </tbody>
          </table>

          <table>
            <thead>
              <tr>
                <td className='border-right'>Date</td>
                <td className='border-right'>Désignation de la prestation</td>
                <td className='border-right'>Quantité</td>
                <td className='border-right'>Prix unitaire</td>
                <td className='border-right'>Taux de TVA</td>
                <td className='border-right'>Montant total HT</td>
                <td className='border-right'>Montant TVA</td>
                <td>Montant TTC</td>
              </tr>
            </thead>
            <tbody>
              {invoice.services.map(service => (
                <tr key={service.id}>
                  <td className='border-right'>
                    {service.date.from.toLocaleDateString()}
                    {service.date.to &&
                      ` au ${service.date.to.toLocaleDateString()}`}
                  </td>
                  <td className='border-right'>{service.title}</td>
                  <td className='nowrap align-center border-right'>
                    {defaultFormatted(service.quantity)}
                  </td>
                  <td className='nowrap align-center border-right'>
                    {financeFormatted(service.unitPrice)}
                  </td>
                  <td className='nowrap align-center border-right'>
                    {percentFormatted(service.VATRate)}
                  </td>
                  <td className='nowrap align-right border-right'>
                    {financeFormatted(service.withoutTaxAmount)}
                  </td>
                  <td className='nowrap align-right border-right'>
                    {financeFormatted(service.taxAmount)}
                  </td>
                  <td className='nowrap align-right'>
                    {financeFormatted(service.taxIncludedAmount)}
                  </td>
                </tr>
              ))}
              <tr>
                <td
                  className='border-right'
                  style={{
                    padding: 10,
                  }}
                ></td>
                <td className='border-right'></td>
                <td className='border-right'></td>
                <td className='border-right'></td>
                <td className='border-right'></td>
                <td className='border-right'></td>
                <td className='border-right'></td>
                <td className='border-right'></td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td className='nowrap border-right'>Totaux</td>
                <td className='border-right'></td>
                <td className='border-right'></td>
                <td className='border-right'></td>
                <td className='border-right'></td>
                <td className='nowrap align-right border-right'>
                  {financeFormatted(invoice.withoutTaxTotalAmount())}
                </td>
                <td className='nowrap align-right border-right'>
                  {financeFormatted(invoice.taxTotalAmount())}
                </td>
                <td className='nowrap align-right border-right'>
                  {financeFormatted(invoice.taxIncludedTotalAmount())}
                </td>
              </tr>
            </tfoot>
          </table>

          <div className='maybe-page2'>
            <div className='generalInfo padding-top-24'>
              <div className='left'>
                <table className='conditions'>
                  <thead>
                    <tr>
                      <td colSpan={2}>Conditions de règlement</td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className='align-right'>Date de règlement :</td>
                      <td className='align-center'>
                        {invoice.paymentDate.toLocaleDateString()}
                      </td>
                    </tr>
                    <tr>
                      <td className='align-right'>Mode de règlement :</td>
                      <td className='align-center fluf'>Chèque ou virement</td>
                    </tr>
                    <tr>
                      <td className='align-right'>Conditions d'escompte :</td>
                      <td className='align-center'></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className='right'>
                <table className='toPayTable'>
                  <tbody>
                    <tr>
                      <td className='bold align-right'>Somme à payer (HT)</td>
                      <td className='bold align-right'>
                        {financeFormatted(invoice.withoutTaxTotalAmount())}
                      </td>
                    </tr>
                    <tr>
                      <td className='bold align-right'>TVA (20 %)</td>
                      <td className='bold align-right'>
                        {financeFormatted(invoice.taxTotalAmount())}
                      </td>
                    </tr>
                    <tr>
                      <td className='bold align-right'>Somme à payer (TTC)</td>
                      <td className='bold align-right'>
                        {financeFormatted(invoice.taxIncludedTotalAmount())}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <p className='notice'>
              En cas de retard, le taux d'intérêt des pénalités de retard +
              montant de l'indemnité forfaitaire (40€) sera applicable
              conformément à l'article L.441-6, alinéa 12 du Code du commerce
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
