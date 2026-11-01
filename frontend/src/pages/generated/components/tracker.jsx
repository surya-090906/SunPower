// Native React page. Data contract: components/tracker.
import { Fragment, text } from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      <ol className={"steps"}>
        {"\n"}
        {data.rows1?.length ? (
          data.rows1.map((row1, index) => (
            <Fragment key={index}>
              <li className={text(row1.v2)}>
                <span className={"dot"}>
                  {row1.choice3 === 0 ? (
                    <>{"✓"}</>
                  ) : row1.choice3 === 1 ? (
                    <>{row1.v4}</>
                  ) : null}
                </span>
                <div>
                  <div className={"lbl"}>{row1.v5}</div>
                  {row1.choice6 === 0 ? (
                    <>
                      <div className={"note"}>{row1.v7}</div>
                    </>
                  ) : null}
                </div>
              </li>
            </Fragment>
          ))
        ) : (
          <></>
        )}
        {"\n"}
      </ol>
      {"\n"}
    </>
  );
}
