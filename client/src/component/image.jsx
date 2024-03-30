export default function Image ({src,...rest}) {
    src = src && src.includes('https://') ? src: 'https://yvettes-mern-blog-plum.vercel.app/' + src
    return (
        <img {...rest} src={src} alt={''}/>
        
    )
}