import {format} from 'date-fns';
import Image from './image';
import { Link } from 'react-router-dom'
function Post ({title, firstName,lastName, summary,author, cover, content, createdAt, _id}) {
  
    return(
        <div className="post">
        <div className="image">
          <Link to={`/post/${_id}`}>
            <Image src={cover}/>

          </Link>
        </div>
        <div className="text">
          <Link to={`/post/${_id}`}>
            <h2>{title}</h2>
            </Link> 
          <p className="info">
            <a href='/'className="author">       {firstName} {lastName}</a>
            <time>{format(new Date(createdAt), 'MMM d, yyyy')}</time>
      
          </p>
          <p className='summary'>{summary}</p>
        </div>
       
      </div>
    )
}
export default Post