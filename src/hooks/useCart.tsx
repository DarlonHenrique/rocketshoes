import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState
} from 'react'
import { toast } from 'react-toastify'
import { api } from '../services/api'
import { Product } from '../types'

interface CartProviderProps {
  children: ReactNode
}

interface UpdateProductAmount {
  productId: number
  amount: number
}

interface CartContextData {
  cart: Product[]
  addProduct: (productId: number) => Promise<void>
  removeProduct: (productId: number) => void
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void
}

const CartContext = createContext<CartContextData>({} as CartContextData)

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart)
    }

    return []
  })

  useEffect(() => {
    localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
  }, [cart])

  const addProduct = async (productId: number) => {
    try {
      const isProductExistInCart = cart.some(product =>
        productId === product.id ? true : false
      )

      const fetchProduct = async (productId: number) => {
        const response = await api.get(`/products/${productId}`)
        if (response.status === 200) {
          return response.data
        } else {
          toast.error('Erro na adição do produto')
        }
      }

      const addNewProduct = async (productId: number) => {
        const product = await fetchProduct(productId)
        product.amount = 1
        setCart([...cart, product])
      }

      const incrementProduct = async (productId: number) => {
        const response = await api.get(`stock/${productId}`)

        setCart(
          cart.map(product => {
            if (productId === product.id) {
              if (product.amount < response.data.amount) {
                product.amount++
                return product
              } else {
                toast.error('Quantidade solicitada fora de estoque')
              }
            }

            return product
          })
        )
      }

      isProductExistInCart
        ? incrementProduct(productId)
        : addNewProduct(productId)
    } catch {
      toast.error('Erro na adição do produto')
    }
  }

  const removeProduct = (productId: number) => {
    try {
      setCart(cart.filter(product => product.id != productId))
    } catch {
      toast.error('Erro na remoção do produto')
    }
  }

  const updateProductAmount = async ({
    productId,
    amount
  }: UpdateProductAmount) => {
    try {
      const response = await api.get(`/stock/${productId}`)

      setCart(
        cart.map(product => {
          if (productId === product.id) {
            const typeOfupdate =
              amount > product.amount ? 'increment' : 'decrement'
            switch (typeOfupdate) {
              case 'increment':
                if (product.amount < response.data.amount) {
                  product.amount = amount
                  console.log(`new product amount: ${product.amount}`)
                  return product
                } else {
                  toast.error('Quantidade solicitada fora de estoque')
                }
                break
              case 'decrement':
                product.amount = amount
                console.log(`new product amount: ${product.amount}`)
                return product
              default:
                toast.error('Erro na alteração de quantidade do produto')
                break
            }
          }
          return product
        })
      )
    } catch {
      toast.error('Erro na alteração de quantidade do produto')
    }
  }

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextData {
  const context = useContext(CartContext)

  return context
}
